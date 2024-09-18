import React, { useCallback, useEffect, useState } from 'react';
import { Input } from '../../ui/input';
import { Sprite } from '../Sprite';

interface AddArchetypeProps {
  setArchetype: (deck: string[]) => void;
  defaultArchetype?: string[];
  isDisabled?: boolean;
}

export const AddArchetype = (props: AddArchetypeProps) => {
  const [pokemonNamePrimary, setPokemonNamePrimary] = useState<string>('');
  const [pokemonNameSecondary, setPokemonNameSecondary] = useState<string>('');
  
  useEffect(() => {
    if (props.defaultArchetype) {
      
      let archetype = JSON.parse(props.defaultArchetype);
      console.log(archetype)
      setPokemonNamePrimary(archetype[0] || '');
      setPokemonNameSecondary(archetype[1] || '');
    }
  }, [props.defaultArchetype]);

  const handlePrimaryInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPokemonNamePrimary(e.target.value.toLowerCase().replace(' ', '-'));
  }, []);

  const handleSecondaryInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPokemonNameSecondary(e.target.value.toLowerCase().replace(' ', '-'));
  }, []);

  useEffect(() => {
    props.setArchetype([pokemonNamePrimary, pokemonNameSecondary]);
  }, [pokemonNamePrimary, pokemonNameSecondary]);

  return (
    <div className='grid grid-cols-4 gap-4 flex items-center'>
      <Input
        autoFocus
        disabled={props.isDisabled}
        className='col-span-3'
        value={pokemonNamePrimary}
        onChange={handlePrimaryInputChange}
        placeholder='Enter name of primary Pokemon in deck'
      />
      {!props.isDisabled && <Sprite name={pokemonNamePrimary} />}
      
      <Input
        disabled={props.isDisabled}
        className='col-span-3'
        value={pokemonNameSecondary}
        onChange={handleSecondaryInputChange}
        placeholder='Enter name of secondary Pokemon in deck'
      />
      {!props.isDisabled && <Sprite name={pokemonNameSecondary} />}
    </div>
  );
};
