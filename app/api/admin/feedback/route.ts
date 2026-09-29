import { isUserAnAdmin } from "@/components/admin/admin.utils";
import type { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

function json(payload: unknown, status = 200) {
  return Response.json(payload, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) return json({ error: "Unauthorized." }, 401);
    if (!isUserAnAdmin(user.id)) return json({ error: "Forbidden." }, 403);

    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<Database["public"]["Tables"]["feedback"]["Row"][]>();

    if (error) throw error;
    return json({ data: data ?? [] });
  } catch (error) {
    console.error("Failed to load admin feedback:", error);
    return json({ error: "Could not load feedback." }, 500);
  }
}
