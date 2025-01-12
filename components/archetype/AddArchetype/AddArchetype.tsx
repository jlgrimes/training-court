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
  const [spriteList, setSpriteList] = useState<string[]>([]);

  useEffect(() => {
    const archetypeArray = (props.archetype || '').split(',').filter((name) => name.trim() !== '');
    setArchetypeState(props.archetype || '');
    setSpriteList(archetypeArray);
  }, [props.archetype]);

  const getArchetypeByIdx = useCallback(
    (idx: number) => spriteList[idx] || '',
    [spriteList]
  );

  const updateArchetypeByIdx = useCallback(
    (idx: number, newArchetype: string) => {
      const updatedSpriteList = [...spriteList];
  
      if (newArchetype.trim() === '') {
        updatedSpriteList.splice(idx, 1);
      } else {
        updatedSpriteList[idx] = newArchetype.trim();
      }
      const uniqueSprites = Array.from(new Set(updatedSpriteList)).slice(0, 2);
  
      setSpriteList([...uniqueSprites]);
      setArchetypeState(uniqueSprites.join(','));
      props.setArchetype(uniqueSprites.join(','));
    },
    [spriteList, props]
  );
  

  if (isLoadingLimitlessUrls) {
    return <Skeleton className="h-[42px] w-[300px] rounded-xl" />;
  }

  if (loadedPokemonUrls && loadedPokemonUrls.length > 0) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <AddLimitlessArchetype
          {...props}
          key={`archetype-0-${spriteList[0] || 'empty'}`}
          archetype={getArchetypeByIdx(0)}
          setArchetype={(deck: string) => updateArchetypeByIdx(0, deck)}
        />        
        <AddLimitlessArchetype
          {...props}
          key={`archetype-1-${spriteList[1] || 'empty'}`}
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
          setSpriteList(sanitized.split(',').filter((name) => name.trim() !== ''));
          props.setArchetype(sanitized);
        }}
        placeholder="Enter names of Pokémon in deck"
      />
      <div className="grid grid-cols-2 gap-2">
        {spriteList.map((spriteName, idx) => (
          <Sprite key={`${spriteName}-${idx}-${spriteList.join('-')}`} name={spriteName} />
        ))}
      </div>
    </div>
  );
};
