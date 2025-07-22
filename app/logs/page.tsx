import { BattleLogsContainerRecoil } from '@/components/battle-logs/BattleLogsContainerRecoil';
import { Header } from '@/components/ui/header';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Logs',
};

export default function LogsPage() {
  return (
    <>
      <Header description='Record your PTCG Live battle logs'>Logs</Header>
      <BattleLogsContainerRecoil />
    </>
  );
}