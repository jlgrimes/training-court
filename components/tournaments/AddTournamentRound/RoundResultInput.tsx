import React, { useCallback, useRef, useEffect, useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface RoundResultInputProps {
  result: string[];
  setResult: (result: string[]) => void;
  turnOrder: string[];
  setTurnOrder: (order: string[]) => void;
  isMatchImmediatelyEnded?: boolean;
}

export const RoundResultInput = (props: RoundResultInputProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    if (containerRef.current && contentRef.current) {
      setCanScroll(contentRef.current.scrollWidth > containerRef.current.clientWidth);
    }
  }, [props.result, props.turnOrder]);

  const handleResultToggle = useCallback((pos: number, val: string) => {
    const newResult = [...props.result];

    if (val === '') {
      newResult.splice(pos, 1);
    } else {
      newResult[pos] = val;
    }

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
      if (props.result.length < 2) return true;
      if (props.result[0] === props.result[1]) return true;
    }
  }, [props.result]);

  return (
    <div 
      ref={containerRef}
      className={cn("relative w-full", canScroll ? "overflow-x-auto" : "overflow-hidden")}
    >
      <div 
        ref={contentRef}
        className="flex gap-6 min-w-fit"
      >
        {[0, 1, 2].map((gameNum) => (
          <div className={cn(
            'flex flex-col gap-2 min-w-[100px]',
            getIsToggleDisabled(gameNum) ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0',
            'transition ease-in-out'
          )} key={`game-${gameNum}-toggle`}>
            <Label className="text-center">Game {gameNum + 1}</Label>
            <div className="flex flex-col gap-1 items-center">
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
    </div>
  );
};
