'use client';

import { useCallback, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { GameId, GAME_OPTIONS, normalizePreferredGames } from '@/lib/game-preferences';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSWRConfig } from 'swr';
import { useRouter } from 'next/navigation';
import { T, useGT } from 'gt-react';

interface GamePreferencesProps {
  userId: string;
  initialPreferredGames?: GameId[];
}

export function GamePreferences({ userId, initialPreferredGames }: GamePreferencesProps) {
  const normalizedInitial = useMemo(
    () => normalizePreferredGames(initialPreferredGames ?? []),
    [initialPreferredGames]
  );

  const [selectedGames, setSelectedGames] = useState<GameId[]>(normalizedInitial);
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const router = useRouter();
  const gt = useGT();

  const toggleGame = useCallback(
    (gameId: GameId) => {
      setSelectedGames((prev) =>
        (prev ?? []).includes(gameId)
          ? (prev ?? []).filter((id) => id !== gameId)
          : [...(prev ?? []), gameId]
      );
    },
    [setSelectedGames]
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      await supabase
        .from('user data')
        .upsert({ id: userId, preferred_games: selectedGames ?? [] })
        .throwOnError();

      await mutate(['user-data', userId]);
      router.refresh();

      toast({
        title: gt('Preferences saved', { $id: 'gamePreferences.toast.savedTitle' }),
        description: gt('Your game visibility has been updated.', { $id: 'gamePreferences.toast.savedDescription' }),
      });
    } catch (error) {
      toast({
        title: gt('Could not save preferences', { $id: 'gamePreferences.toast.errorTitle' }),
        description: error instanceof Error ? error.message : gt('Please try again.', { $id: 'common.pleaseTryAgain' }),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [mutate, router, selectedGames, toast, userId]);


  return (
    <div className='flex flex-col gap-4'>
      <div className='space-y-2'>
        <h3 className='text-lg font-semibold'><T id="gamePreferences.title">Games</T></h3>
        <p className='text-sm text-muted-foreground'>
          <T id="gamePreferences.description">Choose which games you want to show in the application.</T>
        </p>
      </div>
      
      <div className='space-y-3'>
        {GAME_OPTIONS.map((game) => {
          const enabled = (selectedGames ?? []).includes(game.id);
          return (
            <div
              key={game.id}
              className='flex items-center justify-between rounded-md border p-3'
            >
              <div className='flex flex-col'>
                <Label className='font-medium'>{game.label}</Label>
                {game.description && (
                  <p className='text-sm text-muted-foreground'>{game.description}</p>
                )}
                {!game.available && (
                  <p className='text-xs text-muted-foreground mt-1'><T id="common.comingSoon">Coming soon</T></p>
                )}
              </div>
              <Switch
                checked={enabled}
                disabled={!game.available}
                onCheckedChange={() => toggleGame(game.id)}
              />
            </div>
          );
        })}
      </div>

      {/* <Separator /> */}

      <div className='flex justify-end'>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          <T id="gamePreferences.save">Save preferences</T>
        </Button>
      </div>
    </div>
  );
}
