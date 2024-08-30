import React, { useEffect, useState } from 'react';
import { Input } from '../../ui/input';
import { Sprite } from '../Sprite';

interface AddArchetypeProps {
  setArchetype: (deck: string) => void;
  isDisabled?: boolean;
}

export const AddArchetype = (props: AddArchetypeProps) => {
  const [pokemonName, setPokemonName] = useState<string>('');

  // TODO: have it only update props when img is valid
  useEffect(() => {
    props.setArchetype(pokemonName);
  }, [pokemonName]);

  return (
    <div className='grid grid-cols-4 gap-4'>
      <Input disabled={props.isDisabled} className='col-span-3' value={pokemonName} onChange={e => setPokemonName(e.target.value)} placeholder='Enter name of Pokemon in deck' />
      {!props.isDisabled && <Sprite name={pokemonName} />}
    </div>
  )
}