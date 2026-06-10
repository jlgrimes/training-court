import { Metadata } from 'next';
import { LogsPageClient } from './LogsPageClient';

export const metadata: Metadata = {
  title: 'Logs',
};

export default function LogsPage() {
  return <LogsPageClient />;
}
