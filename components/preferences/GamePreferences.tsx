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
        title: 'Preferences saved',
        description: 'Your game visibility has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Could not save preferences',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [mutate, router, selectedGames, toast, userId]);


  return (
    <div className='flex flex-col gap-4'>
      <div className='space-y-2'>
        <h3 className='text-lg font-semibold'>Games</h3>
        <p className='text-sm text-muted-foreground'>
          Choose which games you want to see in your sidebar and related pages.
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
                  <p className='text-xs text-muted-foreground mt-1'>Coming soon</p>
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

      <div className='flex justify-end'>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          Save preferences
        </Button>
      </div>
    </div>
  );
}
