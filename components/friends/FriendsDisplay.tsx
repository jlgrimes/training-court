import { PlusIcon } from "lucide-react";
import { fetchCurrentUser } from "../auth.utils";
import { getAvatarSrc } from "../avatar/avatar.utils";
import { AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { fetchFriends } from "./friend-requests/friend-requests.server.utils";
import { useCallback } from "react";
import { CopySharableLinkButton } from "./CopySharableLinkButton";

export interface FriendsDisplayProps {
  userId: string;
}

export const FriendsDisplay = async (props: FriendsDisplayProps) => {
  const friends = await fetchFriends(props.userId);


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Friends</CardTitle>
        <CopySharableLinkButton userId={props.userId} />
      </CardHeader>
      <CardContent>
        {(!friends || friends.length === 0) && <Label>{`You have no friends :(`}</Label>}
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