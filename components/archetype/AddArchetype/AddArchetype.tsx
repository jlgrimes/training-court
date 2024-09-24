import React, { useCallback, useEffect, useState } from 'react';
import { Input } from '../../ui/input';
import { Sprite } from '../sprites/Sprite';
import { fetchLimitlessSprites } from '../sprites/sprites.utils';
import { AddLimitlessArchetype } from './AddLimitlessArchetype';
import { useLimitlessSprites } from '../sprites/sprites.hooks';
import { Skeleton } from '@/components/ui/skeleton';

export interface AddArchetypeProps {
  setArchetype: (deck: string) => void;
  defaultArchetype?: string;
  isDisabled?: boolean;
}

export const AddArchetype = (props: AddArchetypeProps) => {
  const { data: loadedPokemonUrls, isLoading: isLoadingLimitlessUrls } = useLimitlessSprites();
  const [pokemonName, setPokemonName] = useState<string>('');

  useEffect(() => {
    if (props.defaultArchetype) {
      setPokemonName(props.defaultArchetype);
    }
  }, [props.defaultArchetype]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPokemonName(e.target.value.toLowerCase().replace(' ', '-'));
  }, [setPokemonName]);

  // TODO: have it only update props when img is valid
  useEffect(() => {
    props.setArchetype(pokemonName);
  }, [pokemonName]);

  if (isLoadingLimitlessUrls) {
    return <Skeleton className="h-[42px] w-[300px] rounded-xl" />
  }

  if (loadedPokemonUrls && loadedPokemonUrls.length > 0) {
    return <AddLimitlessArchetype {...props} />
  }

  // fallback input field if api fails
  return (
    <div className='grid grid-cols-4 gap-4'>
      <Input autoFocus disabled={props.isDisabled} className='col-span-3' value={pokemonName} onChange={handleInputChange} placeholder='Enter name of Pokemon in deck' />
      {!props.isDisabled && <Sprite name={pokemonName} />}
    </div>
  )
}