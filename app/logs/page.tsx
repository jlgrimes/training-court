import { fetchCurrentUser } from "@/components/auth.utils"
import { BattleLogsContainer } from "@/components/battle-logs/BattleLogsContainer";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: 'Logs',
};

export default async function LogsPage() {
  const currentUser = await fetchCurrentUser();

  if (!currentUser) {
    redirect('/');
  }

  return (
    <div className="flex flex-col py-4 lg:py-8 pl-8 pr-6 lg:px-16 gap-4 w-full h-full">
      <BattleLogsContainer userId={currentUser.id} />
    </div>
  )
}
