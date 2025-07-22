import { TrainingCourtWelcomeClient } from "./TrainingCourtWelcomeClient";

export const TrainingCourtWelcome = ({ userId }: { userId: string | undefined }) => {
  if (!userId ) return null;

  return <TrainingCourtWelcomeClient />
}