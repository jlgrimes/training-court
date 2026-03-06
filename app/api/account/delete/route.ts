import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get("dryRun") === "true";
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const countRowsByUser = async (table: string, column: string) => {
    const { count, error } = await supabase
      .from(table as any)
      .select("*", { count: "exact", head: true })
      .eq(column, user.id);

    if (error) {
      return { table, column, count: null, error: error.message };
    }

    return { table, column, count: count ?? 0, error: null };
  };

  if (dryRun) {
    const serviceRoleConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

    const [
      logs,
      tournaments,
      tournamentRounds,
      pocketGames,
      pocketTournaments,
      pocketTournamentRounds,
      feedback,
      friendsAsUser,
      friendsAsFriend,
      friendRequests,
    ] = await Promise.all([
      countRowsByUser("logs", "user"),
      countRowsByUser("tournaments", "user"),
      countRowsByUser("tournament rounds", "user"),
      countRowsByUser("pocket_games", "user"),
      countRowsByUser("pocket_tournaments", "user"),
      countRowsByUser("pocket_tournament_rounds", "user"),
      countRowsByUser("feedback", "user_id"),
      countRowsByUser("friends", "user"),
      countRowsByUser("friends", "friend"),
      countRowsByUser("friend requests", "user_sending"),
    ]);

    return Response.json({
      dryRun: true,
      authenticatedUserId: user.id,
      readyForAuthDeletion: serviceRoleConfigured,
      missingRequirements: serviceRoleConfigured ? [] : ["SUPABASE_SERVICE_ROLE_KEY"],
      impact: [
        logs,
        tournaments,
        tournamentRounds,
        pocketGames,
        pocketTournaments,
        pocketTournamentRounds,
        feedback,
        friendsAsUser,
        friendsAsFriend,
        friendRequests,
      ],
      note: "Dry run only. No data or auth user was modified.",
    });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY on the server." },
      { status: 500 }
    );
  }

  try {
    // Current schema stores ownership with required user ids.
    // Until the schema supports a true archived owner, we scrub identifying
    // profile fields and remove auth access while leaving owned records intact.
    const { error: profileError } = await supabase
      .from("user data")
      .update({
        live_screen_name: null,
        avatar: null,
        preferred_games: [],
      })
      .eq("id", user.id);

    if (profileError) {
      throw profileError;
    }

    const { error: outgoingFriendsError } = await supabase
      .from("friends")
      .delete()
      .eq("user", user.id);

    if (outgoingFriendsError) {
      console.warn("Could not remove outgoing friend rows during account deletion.", outgoingFriendsError);
    }

    const { error: incomingFriendsError } = await supabase
      .from("friends")
      .delete()
      .eq("friend", user.id);

    if (incomingFriendsError) {
      console.warn("Could not remove incoming friend rows during account deletion.", incomingFriendsError);
    }

    const { error: friendRequestsError } = await supabase
      .from("friend requests")
      .delete()
      .eq("user_sending", user.id);

    if (friendRequestsError) {
      console.warn("Could not remove pending friend requests during account deletion.", friendRequestsError);
    }

    const adminSupabase = createAdminClient();
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(user.id, true);

    if (deleteError) {
      throw deleteError;
    }

    await supabase.auth.signOut();

    return Response.json({ success: true, deletionMode: "soft" });
  } catch (error) {
    console.error("Account deletion failed:", error);
    return Response.json(
      { error: "Unable to delete account. Check server configuration and try again." },
      { status: 500 }
    );
  }
}
