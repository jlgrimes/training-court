import { fetchUserData } from "./user-data.utils";
import { fetchAvatarImages } from "./avatar/avatar.server.utils";
import { TrainingCourtWelcomeClient } from "./TrainingCourtWelcomeClient";

interface TrainingCourtWelcomeProps {
  userId: string | undefined;
}

export const TrainingCourtWelcome = async ({ userId }: TrainingCourtWelcomeProps) => {
  if (!userId) return null;

  const userData = await fetchUserData(userId);

  // If user has screen name, don't render welcome
  if (userData?.live_screen_name) return null;

  const avatarImages = fetchAvatarImages();
  return <TrainingCourtWelcomeClient userId={userId} avatarImages={avatarImages} />
}