'use client';

import { useEffect, useState } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Database } from '@/database.types';
import { createClient } from '@/utils/supabase/client';
import { MAX_SAVED_DECKLISTS } from './deckbuilder.constants';

type DecklistRow = Pick<
  Database['public']['Tables']['decklists']['Row'],
  'archetype' | 'id' | 'name'
>;

type DecklistSelectProps = {
  userId: string;
  value: string | null;
  onChange: (decklist: DecklistRow | null) => void;
  noneLabel?: string;
  ariaLabel?: string;
};

const NONE_VALUE = 'none';

export function DecklistSelect(props: DecklistSelectProps) {
  const [decklists, setDecklists] = useState<DecklistRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const noneLabel = props.noneLabel ?? 'No decklist';

  useEffect(() => {
    let isActive = true;

    const loadDecklists = async () => {
      setIsLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from('decklists')
        .select('id,name,archetype')
        .eq('user_id', props.userId)
        .eq('game', 'pokemon-tcg')
        .order('updated_at', { ascending: false })
        .limit(MAX_SAVED_DECKLISTS)
        .returns<DecklistRow[]>();

      if (isActive) {
        setDecklists(data ?? []);
        setIsLoading(false);
      }
    };

    void loadDecklists();

    return () => {
      isActive = false;
    };
  }, [props.userId]);

  return (
    <Select
      value={props.value ?? NONE_VALUE}
      onValueChange={(value) => {
        if (value === NONE_VALUE) {
          props.onChange(null);
          return;
        }

        props.onChange(decklists.find((decklist) => decklist.id === value) ?? null);
      }}
      disabled={isLoading}
    >
      <SelectTrigger aria-label={props.ariaLabel ?? 'Decklist'} className="w-full">
        <SelectValue placeholder={isLoading ? 'Loading decklists...' : 'Select decklist'} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        <SelectItem value={NONE_VALUE}>{noneLabel}</SelectItem>
        {decklists.map((decklist) => (
          <SelectItem key={decklist.id} value={decklist.id}>
            {decklist.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
