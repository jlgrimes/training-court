'use client';

import { useMemo, useState } from 'react';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HatType, hatOverlays } from '@/components/archetype/sprites/hats/hats.config';
import { cn } from '@/lib/utils';
import { Check, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export type HatOptionValue = HatType | 'none';

interface HatEditDialogProps {
  tournamentName: string;
  currentHat: string | null;
  onChange: (nextHat: string | null) => Promise<void> | void;
}

interface HatOption {
  value: HatOptionValue;
  label: string;
  description?: string;
}

const formatHatLabel = (hat: HatOptionValue) => {
  if (hat === 'none') return 'No hat';
  return `${hat.charAt(0).toUpperCase()}${hat.slice(1)} hat`;
};

export function HatEditDialog({ tournamentName, currentHat, onChange }: HatEditDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [savingValue, setSavingValue] = useState<HatOptionValue | null>(null);

  const hatOptions = useMemo<HatOption[]>(() => [
    { value: 'none', label: 'No hat', description: 'Keep sprites unadorned.' },
    ...Object.keys(hatOverlays).map((key) => ({
      value: key as HatType,
      label: formatHatLabel(key as HatType),
      description: 'Add a festive overlay to your decks.',
    })),
  ], []);

  const handleSelect = async (value: HatOptionValue) => {
    const nextHat = value === 'none' ? null : value;
    setSavingValue(value);

    try {
      await onChange(nextHat);
      toast({
        title: nextHat ? `${formatHatLabel(value)} applied` : 'Hat removed',
      });
      setOpen(false);
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Could not update hat',
        description: e?.message ?? 'Please try again.',
      });
    } finally {
      setSavingValue(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="w-8 h-8"><Sparkles className="h-4 w-4" color="gray" /></Button>
      </DialogTrigger>
      <DialogContent className="w-[min(92vw,640px)] sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle>Choose a hat for {tournamentName}</DialogTitle>
          <p className="text-sm text-muted-foreground">Applies to this tournament only.</p>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {hatOptions.map((option) => {
            const isActive = (currentHat ?? 'none') === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 text-left transition',
                  'hover:border-primary/60 hover:bg-muted',
                  isActive && 'border-primary bg-primary/5',
                  savingValue && 'opacity-70 cursor-not-allowed'
                )}
                disabled={!!savingValue}
              >
                <div className="relative flex h-12 w-12 items-center justify-center rounded-md border bg-background">
                  {option.value !== 'none' ? (
                    <img
                      src={hatOverlays[option.value as HatType].src}
                      alt={option.label}
                      className="h-10 w-10 object-contain"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">None</span>
                  )}
                  {isActive && <Check className="absolute -right-1 -top-1 h-4 w-4 text-primary" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium leading-tight">{option.label}</div>
                  {option.description && (
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
