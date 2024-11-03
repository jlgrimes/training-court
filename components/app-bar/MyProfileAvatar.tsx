'use client';

import { User } from "@supabase/supabase-js";
import { getAvatarSrc } from "../avatar/avatar.utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useUserData } from "@/hooks/user-data/useUserData";

interface MyProfileAvatarProps {
  user: User | null;
}

export function MyProfileAvatar (props: MyProfileAvatarProps) {
  const { data: userData } = useUserData(props.user?.id);

  return (
    <Avatar>
      {userData?.avatar && <AvatarImage className="pixel-image" src={getAvatarSrc(userData.avatar)} />}
      <AvatarFallback>{props.user?.email?.slice(0, 2).toUpperCase()}</AvatarFallback>
    </Avatar>
  )
}