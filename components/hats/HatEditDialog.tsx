'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  disabled?: boolean;
  purchaseType?: string;
}

const formatHatLabel = (hat: HatOptionValue) => {
  if (hat === 'none') return 'No hat';
  return `${hat.charAt(0).toUpperCase()}${hat.slice(1)} hat`;
};

const getDisabledDescription = (purchaseType?: string) => {
  if (purchaseType === 'purchasable') return 'Requires purchase.';
  if (purchaseType === 'not-for-sale') return 'Not for sale.';
  return 'Unavailable right now.';
};

export function HatEditDialog({ tournamentName, currentHat, onChange }: HatEditDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [savingValue, setSavingValue] = useState<HatOptionValue | null>(null);

  const currentHatOverlay = currentHat ? hatOverlays[currentHat as HatType] : undefined;
  const currentHatDisabled = currentHat === 'santa' || !!currentHatOverlay?.disabled;

  const hatOptions: HatOption[] = [
    { value: 'none', label: 'No hat', description: 'Keep sprites unadorned.' },
    ...Object.entries(hatOverlays).map(([key, hat]) => {
      const isDisabled = key === 'santa' || !!hat.disabled;
      return {
        value: key as HatType,
        label: formatHatLabel(key as HatType),
        description: isDisabled ? getDisabledDescription(hat.purchaseType) : 'Add a festive overlay to your decks.',
        disabled: isDisabled,
        purchaseType: hat.purchaseType,
      };
    }),
  ];

  const isOptionDisabled = (option: HatOption) => {
    if (savingValue) return true;
    if (currentHatDisabled) return true;
    if (option.value === 'none') return false;
    if (option.value === 'santa') return true;
    return !!option.disabled;
  };

  const handleSelect = async (option: HatOption) => {
    if (isOptionDisabled(option)) return;
    const nextHat = option.value === 'none' ? null : option.value;
    setSavingValue(option.value);

    try {
      await onChange(nextHat);
      toast({
        title: nextHat ? `${formatHatLabel(option.value)} applied` : 'Hat removed',
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
          {currentHatDisabled && (
            <p className="text-xs text-muted-foreground">This hat is locked and cannot be changed yet.</p>
          )}
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {hatOptions.map((option) => {
            const isActive = (currentHat ?? 'none') === option.value;
            const isDisabled = option.disabled
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 text-left transition',
                  !isDisabled && 'hover:border-primary/60 hover:bg-muted',
                  isActive && 'border-primary bg-primary/5',
                  isDisabled && 'cursor-not-allowed opacity-60'
                )}
                disabled={isDisabled}
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
