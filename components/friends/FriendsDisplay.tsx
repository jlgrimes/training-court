import { fetchCurrentUser } from "../auth.utils";
import { getAvatarSrc } from "../avatar/avatar.utils";
import { AvatarImage } from "../ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { fetchFriends } from "./friend-requests/friend-requests.server.utils";

interface FriendsDisplayProps {
  userId: string;
}

export const FriendsDisplay = async (props: FriendsDisplayProps) => {
  const friends = await fetchFriends(props.userId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Friends</CardTitle>
      </CardHeader>
      <CardContent>
        {friends?.map(({ friend }) => (
          <div className="flex gap-1">
            {friend.avatar && <AvatarImage className="pixel-image" src={getAvatarSrc(friend.avatar)} />}
            <Label>{friend.live_screen_name}</Label>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}