import { fetchCurrentUser } from "@/components/auth.utils";
import { fetchFriendRequestWithUserData, FetchFriendRequestError } from "@/components/friends/friend-requests/friend-requests.server.utils";
import { FriendRequestAcceptPage } from "@/components/friends/friend-requests/FriendRequestAcceptPage";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function FriendRequestReceivePage({ params }: { params: { id: string } }) {
  try {
    const user = await fetchCurrentUser();

    if (!user) {
      return redirect('/');
    }

    const friendRequest = await fetchFriendRequestWithUserData(params.id);

    if (user && (user.id === friendRequest.user_sending.id)) {
      return (
        <div className="flex-1 flex flex-col w-full h-full sm:max-w-lg justify-between gap-2 p-4">
          <Label>You can't accept your own friend request silly!</Label>
          <Link href='/home'>
            <Button>Home</Button>
          </Link>
        </div>
      )
    }

    return <FriendRequestAcceptPage accepterUserId={user.id} friendRequestData={friendRequest} />;

  } catch (error) {
    if (error === FetchFriendRequestError.HasExpired) {
      return (
        <div className="flex-1 flex flex-col w-full h-full sm:max-w-lg justify-between gap-2 p-4">
          <Label>Friend request error has expired. Ask your friend to send a new one!</Label>
          <Link href='/home'>
            <Button>Home</Button>
          </Link>
        </div>
      )
    }

    return redirect("/");
  }
}
