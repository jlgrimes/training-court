'use client';

import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { AvatarSelector } from "./avatar/AvatarSelector";
import { ScreenNameEditable } from "./screen-name/ScreenNameEditable";

interface TrainingCourtWelcomeClientProps {
  userId: string;
  avatarImages: string[];
}

export const TrainingCourtWelcomeClient = ({ userId, avatarImages }: TrainingCourtWelcomeClientProps) => {
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