import { Database } from "@/database.types";
import { fetchAvatarImages } from "./avatar/avatar.server.utils";
import { TrainingCourtWelcomeClient } from "./TrainingCourtWelcomeClient";

type UserData = Database['public']['Tables']['user data']['Row'];

interface TrainingCourtWelcomeProps {
  userId: string | undefined;
  userData?: UserData | null;
}

export const TrainingCourtWelcome = ({ userId, userData }: TrainingCourtWelcomeProps) => {
  const avatarImages = fetchAvatarImages();

  if (!userId) return null;

  // If server already knows user has screen name, don't render welcome
  if (userData?.live_screen_name) return null;

  return <TrainingCourtWelcomeClient userId={userId} avatarImages={avatarImages} userData={userData} />
}