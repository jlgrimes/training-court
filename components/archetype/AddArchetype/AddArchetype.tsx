import React, { useCallback, useEffect, useState } from 'react';
import { Input } from '../../ui/input';
import { Sprite } from '../sprites/Sprite';

interface AddArchetypeProps {
  setArchetype: (deck: string) => void;
  defaultArchetype?: string;
  isDisabled?: boolean;
}

export const AddArchetype = (props: AddArchetypeProps) => {
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

  return (
    <div className='grid grid-cols-4 gap-4'>
      <Input autoFocus disabled={props.isDisabled} className='col-span-3' value={pokemonName} onChange={handleInputChange} placeholder='Enter name of Pokemon in deck' />
      {!props.isDisabled && <Sprite name={pokemonName} />}
    </div>
  )
}