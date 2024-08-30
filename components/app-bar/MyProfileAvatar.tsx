import { fetchCurrentUser } from "../auth.utils";
import { getAvatarSrc } from "../avatar/avatar.utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { fetchUserData } from "../user-data.utils";

export async function MyProfileAvatar () {
  const me = await fetchCurrentUser();
  const userData = me ? await fetchUserData(me.id) : null;

  return (
    <Avatar>
      {userData?.avatar && <AvatarImage className="pixel-image" src={getAvatarSrc(userData.avatar)} />}
      <AvatarFallback>{me?.email?.slice(0, 2).toUpperCase()}</AvatarFallback>
    </Avatar>
  )
}