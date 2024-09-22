import React, { useCallback, useEffect, useState } from 'react';
import { Input } from '../../ui/input';
import { Sprite } from '../Sprite';

interface AddArchetypeProps {
  setArchetype: (deck: string) => void;
  defaultArchetype?: string;
  isDisabled?: boolean;
}

export const AddArchetype = (props: AddArchetypeProps) => {
  const [primaryPokemonName, setPrimaryPokemonName] = useState<string>('');
  const [secondaryPokemonName, setSecondaryPokemonName] = useState<string>('');

  useEffect(() => {
    if (props.defaultArchetype) {
      const [primary, secondary] = props.defaultArchetype.split(',').map(p => p.trim());
      setPrimaryPokemonName(primary);
      setSecondaryPokemonName(secondary || '');
    }
  }, [props.defaultArchetype]);

  const handlePrimaryInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPrimaryPokemonName(e.target.value.toLowerCase().replace(' ', '-'));
  }, []);

  const handleSecondaryInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSecondaryPokemonName(e.target.value.toLowerCase().replace(' ', '-'));
  }, []);

  // TODO: have it only update props when img is valid
  useEffect(() => {
    const deck = secondaryPokemonName ? `${primaryPokemonName},${secondaryPokemonName}` : primaryPokemonName;
    props.setArchetype(deck);
  }, [primaryPokemonName, secondaryPokemonName, props.setArchetype]);

  return (
    <div className='grid grid-cols-4 gap-4 items-center'>
      <Input autoFocus disabled={props.isDisabled} className='col-span-3' value={primaryPokemonName} onChange={handlePrimaryInputChange} placeholder='Enter name of primary Pokémon in deck' />
        {!props.isDisabled && (<Sprite name={primaryPokemonName} />)}
      <Input disabled={props.isDisabled} className='col-span-3' value={secondaryPokemonName} onChange={handleSecondaryInputChange} placeholder='Enter name of secondary Pokémon in deck' />
        {!props.isDisabled && (<Sprite name={secondaryPokemonName} />)}
    </div>
  )
}