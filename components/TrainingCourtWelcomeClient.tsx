'use client';

import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { AvatarSelector } from "./avatar/AvatarSelector";
import { ScreenNameEditable } from "./screen-name/ScreenNameEditable";
import { useAuth } from "@/app/recoil/hooks/useAuth";
import { useUserData } from "@/hooks/user-data/useUserData";
import { useEffect, useState } from "react";
export const TrainingCourtWelcomeClient = () => {
  const { user, isAuthenticated } = useAuth();
  const { data: userData, isLoading } = useUserData(user?.id);
  const [avatarImages, setAvatarImages] = useState<string[]>([]);

  useEffect(() => {
    // For now, use a static list of avatar images
    // In production, this should be fetched from an API endpoint
    const defaultAvatars = [
      'ace-trainer-f.png', 'ace-trainer-m.png', 'aether-employee-f.png', 
      'aether-employee-m.png', 'beauty.png', 'blackbelt.png', 
      'breeder-f.png', 'breeder-m.png', 'clerk-f.png', 'clerk-m.png',
      'doctor.png', 'fisher.png', 'gentleman.png', 'hex-maniac.png',
      'lady.png', 'lass.png', 'pokefan-f.png', 'pokefan-m.png',
      'pokemon-ranger-f.png', 'pokemon-ranger-m.png', 'psychic-m.png',
      'punk-guy.png', 'punk-girl.png', 'rich-boy.png', 'roughneck.png',
      'scientist-f.png', 'scientist-m.png', 'swimmer-f.png', 'swimmer-m.png',
      'worker.png', 'youngster.png'
    ];
    setAvatarImages(defaultAvatars);
  }, []);

  if (!isAuthenticated || !user || isLoading || userData?.live_screen_name) return null;

  return (
    <Card className="px-1 py-2">
      <CardHeader>
        <CardTitle>Welcome to Training Court</CardTitle>
        <CardDescription>Enter your PTCG Live screen name and pick an avatar to get started!</CardDescription>
        <AvatarSelector userId={user.id} avatarImages={avatarImages} />
        <ScreenNameEditable userId={user.id} />
      </CardHeader>
    </Card>
  );
};