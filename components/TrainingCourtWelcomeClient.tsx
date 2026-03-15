'use client';

import { T } from "gt-react";
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
        <T id="home.welcomeCard.title">
          <CardTitle>Welcome to Training Court</CardTitle>
        </T>
        <T id="home.welcomeCard.description">
          <CardDescription>
            Enter your PTCG Live screen name and pick an avatar to get started!
          </CardDescription>
        </T>
        <AvatarSelector userId={userId} avatarImages={avatarImages} />
        <ScreenNameEditable userId={userId} />
      </CardHeader>
    </Card>
  )
}
