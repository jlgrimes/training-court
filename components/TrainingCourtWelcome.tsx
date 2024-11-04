import { fetchAvatarImages } from "./avatar/avatar.server.utils";
import { TrainingCourtWelcomeClient } from "./TrainingCourtWelcomeClient";

export const TrainingCourtWelcome = ({ userId }: { userId: string | undefined }) => {
  const avatarImages = fetchAvatarImages();

  if (!userId ) return null;

  return <TrainingCourtWelcomeClient userId={userId} avatarImages={avatarImages} />
}