import React, { useCallback, useEffect, useState } from 'react';
import { Input } from '../../ui/input';
import { Sprite } from '../sprites/Sprite';
import { fetchLimitlessSprites } from '../sprites/sprites.utils';
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
  const [pokemonName, setPokemonName] = useState<string>('');

  useEffect(() => {
    if (props.archetype) {
      setPokemonName(props.archetype);
    }
  }, [props.archetype]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPokemonName(e.target.value.toLowerCase().replace(' ', '-'));
  }, [setPokemonName]);

  // TODO: have it only update props when img is valid
  useEffect(() => {
    props.setArchetype(pokemonName);
  }, [pokemonName]);

  const getArchetypeByIdx = useCallback((idx: number) => {
    if (!props.archetype) return undefined;
    const splitArchetype = props.archetype.split(',');

    if (idx === 1 && splitArchetype.length === 1) return undefined;
    return splitArchetype[idx];
  }, [props.archetype]);

  const setArchetype = useCallback((idx: number, newArchetype: string) => {
    const splitArchetype = (props.archetype ?? '').split(',');

    if (idx === 0 && splitArchetype.length === 1) props.setArchetype(newArchetype);
    if (idx === 0 && splitArchetype.length === 2) props.setArchetype(`${newArchetype},${splitArchetype[1]}`);
    if (idx === 1) props.setArchetype(`${splitArchetype[0]},${newArchetype}`);
  }, [props.archetype, props.setArchetype]);

  if (isLoadingLimitlessUrls) {
    return <Skeleton className="h-[42px] w-[300px] rounded-xl" />
  }

  if (loadedPokemonUrls && loadedPokemonUrls.length > 0) {
    return (
      <div className='grid grid-cols-2 gap-2'>
        <AddLimitlessArchetype {...props} archetype={getArchetypeByIdx(0)} setArchetype={(deck: string) => setArchetype(0, deck)} />
        <AddLimitlessArchetype {...props} archetype={getArchetypeByIdx(1)} setArchetype={(deck: string) => setArchetype(1, deck)} />
      </div>
    )
  }

  // fallback input field if api fails
  return (
    <div className='grid grid-cols-4 gap-4'>
      <Input autoFocus disabled={props.isDisabled} className='col-span-3' value={pokemonName} onChange={handleInputChange} placeholder='Enter name of Pokemon in deck' />
      {!props.isDisabled && <Sprite name={pokemonName} />}
    </div>
  )
}