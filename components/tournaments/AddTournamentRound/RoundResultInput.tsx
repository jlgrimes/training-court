import React, { useCallback } from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { getTextOfJSDocComment } from 'typescript';
import { cn } from '@/lib/utils';

interface RoundResultInputProps {
  result: string[];
  setResult: (result: string[]) => void;
  isMatchImmediatelyEnded?: boolean;
}

export const RoundResultInput = (props: RoundResultInputProps) => {
  const handleResultToggle = useCallback((pos: number, val: string) => {
    if (pos >= props.result.length) {
      return props.setResult([...props.result, val]);
    }

    if (val === '') {
      return props.setResult([...props.result.slice(0, pos)])
    }

    const newResult = [...props.result];
    newResult[pos] = val;

    props.setResult(newResult);
  }, [props.result, props.setResult]);

  const getIsToggleDisabled = useCallback((pos: number) => {
    if ((pos >= 1) && (props.result.length >= 1) && (props.result[0] === 'T')) return true;
    if ((pos >= 1) && props.isMatchImmediatelyEnded) return true;

    if (pos === 1) {
      return props.result.length < 1;
    } else if (pos === 2) {
      // has to be either WW or LL
      if (props.result[0] === props.result[1]) return true;
      return props.result.length < 2
    }
  }, [props.result]);

  return (
    <div className='flex gap-4'>
      {[0, 1, 2].map((gameNum) => (
        <ToggleGroup
          className={cn(
            getIsToggleDisabled(gameNum) ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0',
            'transition ease-in-out'
          )}
          type='single'
          disabled={getIsToggleDisabled(gameNum)} 
          value={props.result.at(gameNum) ?? ''}
          onValueChange={(val) => handleResultToggle(gameNum, val)}
        >
          <ToggleGroupItem value="W">W</ToggleGroupItem>
          <ToggleGroupItem value="L">L</ToggleGroupItem>
          {gameNum !== 1 && <ToggleGroupItem value="T">T</ToggleGroupItem>}
        </ToggleGroup>
      ))}
    </div>
  )
}