import React, { useCallback } from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { getTextOfJSDocComment } from 'typescript';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface RoundResultInputProps {
  result: string[];
  setResult: (result: string[]) => void;
  turnOrder: string[]
  setTurnOrder: (order: string[]) => void;
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

  const handleTurnOrderToggle = useCallback((pos: number, val: string) => {
    const newOrder = [...props.turnOrder];
    newOrder[pos] = val;

    props.setTurnOrder(newOrder);
  }, [props.turnOrder, props.setTurnOrder]);

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
    <div className='flex gap-6'>
      {[0, 1, 2].map((gameNum) => (
        <div className={cn(
          'flex flex-col gap-2',
          getIsToggleDisabled(gameNum) ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0',
          'transition ease-in-out'
        )} key={`game-${gameNum}-toggle`}>
          <Label>Game {gameNum + 1}</Label>
          <div className='flex flex-col gap-1 items-start'>
            <ToggleGroup
              type='single'
              disabled={getIsToggleDisabled(gameNum)} 
              value={props.result.at(gameNum) ?? ''}
              onValueChange={(val) => handleResultToggle(gameNum, val)}
            >
              <ToggleGroupItem value="W">W</ToggleGroupItem>
              <ToggleGroupItem value="L">L</ToggleGroupItem>
              {gameNum !== 1 && <ToggleGroupItem value="T">T</ToggleGroupItem>}
            </ToggleGroup>
            <ToggleGroup
              size='sm'
              type='single'
              disabled={getIsToggleDisabled(gameNum)} 
              value={props.turnOrder.at(gameNum) ?? ''}
              onValueChange={(val) => handleTurnOrderToggle(gameNum, val)}
            >
              <ToggleGroupItem value='1' className='text-muted-foreground'>1st</ToggleGroupItem>
              <ToggleGroupItem value='2' className='text-muted-foreground'>2nd</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      ))}
    </div>
  )
}