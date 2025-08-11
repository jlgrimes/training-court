'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

export interface Game {
  value: string;
  label: string;
  description?: string;
}

const games: Game[] = [
  {
    value: 'tradingCardGame',
    label: 'Trading Card Game',
    description: 'Pokémon TCG Live battle logs and tournaments',
  },
  {
    value: 'videoGame',
    label: 'Video Game',
    description: 'VGC battles, tournaments, and team management',
  },
  {
    value: 'pocket',
    label: 'Pocket',
    description: 'Pokémon TCG Pocket game logs',
  },
];

interface GameSelectorProps {
  selectedGames: string[];
  onGamesChange: (games: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function GameSelector({
  selectedGames,
  onGamesChange,
  placeholder = 'Select games...',
  className,
}: GameSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const handleGameToggle = (gameValue: string) => {
    if (selectedGames.includes(gameValue)) {
      onGamesChange(selectedGames.filter((g) => g !== gameValue));
    } else {
      onGamesChange([...selectedGames, gameValue]);
    }
  };

  const selectedGameLabels = games
    .filter((game) => selectedGames.includes(game.value))
    .map((game) => game.label);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
        >
          {selectedGames.length > 0 ? (
            <div className="flex gap-1 flex-wrap">
              {selectedGameLabels.map((label) => (
                <Badge
                  variant="secondary"
                  key={label}
                  className="mr-1"
                >
                  {label}
                </Badge>
              ))}
            </div>
          ) : (
            placeholder
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search games..." />
          <CommandEmpty>No games found.</CommandEmpty>
          <CommandGroup>
            {games.map((game) => (
              <CommandItem
                key={game.value}
                value={game.value}
                onSelect={() => handleGameToggle(game.value)}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    selectedGames.includes(game.value) ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <div className="flex-1">
                  <div className="font-medium">{game.label}</div>
                  {game.description && (
                    <div className="text-sm text-muted-foreground">
                      {game.description}
                    </div>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}