'use client';

import { useUserData } from "@/hooks/user-data/useUserData"
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { AvatarSelector } from "./avatar/AvatarSelector";
import { ScreenNameEditable } from "./screen-name/ScreenNameEditable";

export const TrainingCourtWelcomeClient = ({ userId, avatarImages }: { userId: string | undefined, avatarImages: string[] }) => {
  const { data: userData, isLoading } = useUserData(userId);

  if (!userId || isLoading || userData?.live_screen_name) return null;

  return (
    <Card className="px-1 py-2">
      <CardHeader>
        <CardTitle>Welcome to Training Court</CardTitle>
        <CardDescription>Enter your PTCG Live screen name and pick an avatar to get started!</CardDescription>
        <AvatarSelector userId={userId} avatarImages={avatarImages} />
        <ScreenNameEditable userId={userId} />
      </CardHeader>
    </Card>
  )
}