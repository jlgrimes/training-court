'use client';

import { getAvatarSrc } from "@/components/avatar/avatar.utils";
import { AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label"
import { Database } from "@/database.types"
import { redirect } from "next/navigation"
import { addFriend } from "./friend-requests.utils";
import { FriendRequestWithUserData } from "./friend-requests.server.utils";

interface FriendRequestAcceptPageProps {
  friendRequestData: FriendRequestWithUserData;
  accepterUserId: string;
}

export const FriendRequestAcceptPage = (props: FriendRequestAcceptPageProps) => {
  return (
    <div className="flex-1 flex flex-col w-full h-full sm:max-w-lg justify-between gap-2 p-4">
      <Card>
        <CardContent>
        <div>
          {props.friendRequestData ? (
            <div className='flex gap-1'>
              {props.friendRequestData.user_sending.avatar && <AvatarImage className="pixel-image" src={getAvatarSrc(props.friendRequestData.user_sending.avatar)} />}
              <strong>{props.friendRequestData.user_sending.live_screen_name}</strong>
            </div>
          ) : <strong>Someone</strong>}
          sent you a friend request.
        </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => addFriend(props.friendRequestData, props.accepterUserId)}>Accept</Button>
          <Button variant='secondary' onClick={() => redirect("/")}>Nah</Button>
        </CardFooter>
      </Card>
    </div>
  )
}