'use client';

import { User } from "@supabase/supabase-js";
import { getAvatarSrc } from "../avatar/avatar.utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useUserData } from "@/hooks/user-data/useUserData";

interface MyProfileAvatarProps {
  user: User | null;
}

export function MyProfileAvatar (props: MyProfileAvatarProps) {
  const { data: userData, isLoading } = useUserData(props.user?.id);

  // While user data is loading (or the avatar image is still decoding),
  // show an empty circle instead of flashing the generic initials.
  const showInitials = !isLoading && !userData?.avatar;

  return (
    <Avatar>
      {userData?.avatar && <AvatarImage className="pixel-image" src={getAvatarSrc(userData.avatar)} />}
      <AvatarFallback>{showInitials ? props.user?.email?.slice(0, 2).toUpperCase() : null}</AvatarFallback>
    </Avatar>
  )
}