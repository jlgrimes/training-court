import React, { useCallback, useEffect, useState } from 'react';
import { Input } from '../../ui/input';
import { Sprite } from '../sprites/Sprite';
import { AddLimitlessArchetype } from './AddLimitlessArchetype';
import { useLimitlessSprites } from '../sprites/sprites.hooks';
import { Skeleton } from '@/components/ui/skeleton';

export interface AddArchetypeProps {
  archetype: string | undefined;
  setArchetype: (deck: string) => void;
  isDisabled?: boolean;
}

export const AddArchetype = (props: AddArchetypeProps) => {
  const { data: loadedPokemonUrls, isLoading: isLoadingLimitlessUrls } = useLimitlessSprites();
  const [archetype, setArchetypeState] = useState<string>('');

  useEffect(() => {
    setArchetypeState(props.archetype || '');
  }, [props.archetype]);

  const getArchetypeByIdx = useCallback(
    (idx: number) => {
      const splitArchetype = archetype.split(',').filter((name) => name.trim() !== '');
      return splitArchetype[idx] || '';
    },
    [archetype]
  );

  const updateArchetypeByIdx = useCallback(
    (idx: number, newArchetype: string) => {
      const splitArchetype = archetype.split(',').filter((name) => name.trim() !== '');
      if (newArchetype.trim() === '') {
        splitArchetype[idx] = '';
      } else {
        splitArchetype[idx] = newArchetype.trim();
      }

      const updatedArchetype = [splitArchetype[0] || '', splitArchetype[1] || '']
        .filter((name) => name.trim() !== '')
        .join(',');

      setArchetypeState(updatedArchetype);
      props.setArchetype(updatedArchetype);
    },
    [archetype, props]
  );

  if (isLoadingLimitlessUrls) {
    return <Skeleton className="h-[42px] w-[300px] rounded-xl" />;
  }

  if (loadedPokemonUrls && loadedPokemonUrls.length > 0) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <AddLimitlessArchetype
          {...props}
          archetype={getArchetypeByIdx(0)}
          setArchetype={(deck: string) => updateArchetypeByIdx(0, deck)}
        />
        <AddLimitlessArchetype
          {...props}
          archetype={getArchetypeByIdx(1)}
          setArchetype={(deck: string) => updateArchetypeByIdx(1, deck)}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      <Input
        autoFocus
        disabled={props.isDisabled}
        className="col-span-3"
        value={archetype}
        onChange={(e) => {
          const sanitized = e.target.value.split(',').slice(0, 2).join(',');
          setArchetypeState(sanitized);
          props.setArchetype(sanitized);
        }}
        placeholder="Enter names of Pokémon in deck"
      />
      {!props.isDisabled && <Sprite name={getArchetypeByIdx(0) || ''} />}
    </div>
  );
};
