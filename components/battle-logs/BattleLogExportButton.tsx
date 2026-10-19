'use client';

import { useState } from 'react';
import { T, useGT } from 'gt-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export function BattleLogExportButton({ logId }: { logId?: string }) {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const gt = useGT();

  async function download() {
    setBusy(true);
    try {
      const response = await fetch(`/api/battle-logs/export${logId ? `?id=${encodeURIComponent(logId)}` : ''}`, {
        credentials: 'same-origin', cache: 'no-store',
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = logId ? `battle-log-${logId}.txt` : 'training-court-battle-logs.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast({ variant: 'destructive', title: gt('Export failed. Please sign in and try again.', { $id: 'battleLogs.export.error' }) });
    } finally {
      setBusy(false);
    }
  }

  return <Button type="button" variant="outline" size="sm" disabled={busy} onClick={download}>
    {busy ? <T id="battleLogs.export.busy">Exporting…</T>
      : logId ? <T id="battleLogs.export.single">Download raw log</T>
      : <T id="battleLogs.export.all">Export all raw logs</T>}
  </Button>;
}
