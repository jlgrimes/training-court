import { User } from "@supabase/supabase-js";
import { fetchCurrentUser } from "../auth.utils";
import { getAvatarSrc } from "../avatar/avatar.utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { fetchUserData } from "../user-data.utils";

interface MyProfileAvatarProps {
  user: User | null;
}

export async function MyProfileAvatar (props: MyProfileAvatarProps) {
  const userData = props.user ? await fetchUserData(props.user.id) : null;

  return (
    <Avatar>
      {userData?.avatar && <AvatarImage className="pixel-image" src={getAvatarSrc(userData.avatar)} />}
      <AvatarFallback>{props.user?.email?.slice(0, 2).toUpperCase()}</AvatarFallback>
    </Avatar>
  )
}