import { fetchCurrentUser } from "../auth.utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
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
        {friends?.map(())}
      </CardContent>
    </Card>
  )
}