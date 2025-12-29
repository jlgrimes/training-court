'use client';

import { Database } from "@/database.types";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { AvatarSelector } from "./avatar/AvatarSelector";
import { ScreenNameEditable } from "./screen-name/ScreenNameEditable";

type UserData = Database['public']['Tables']['user data']['Row'];

interface TrainingCourtWelcomeClientProps {
  userId: string | undefined;
  avatarImages: string[];
  userData?: UserData | null;
}

export const TrainingCourtWelcomeClient = ({ userId, avatarImages, userData }: TrainingCourtWelcomeClientProps) => {
  // Server already checked if user has screen name, so we can render directly
  if (!userId) return null;

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