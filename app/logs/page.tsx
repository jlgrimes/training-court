import { fetchCurrentUser } from "@/components/auth.utils"
import { BattleLogsContainer } from "@/components/battle-logs/BattleLogsContainer";
import { redirect } from "next/navigation";

export default async function LogsPage() {
  const currentUser = await fetchCurrentUser();

  if (!currentUser) {
    redirect('/');
  }

  return (
    <BattleLogsContainer />
  )
}
