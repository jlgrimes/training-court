'use client';

import { PlusIcon } from "lucide-react"
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Button } from "../ui/button"
import { useCallback, useState } from "react";
import { AddArchetype } from "../archetype/AddArchetype/AddArchetype";
import { useSWRConfig } from "swr";
import { Label } from "../ui/label";
import { createClient } from "@/utils/supabase/client";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { useToast } from "../ui/use-toast";

export const AddPocketMatch = ({ userId }: { userId: string}) => {
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const [myDeck, setMyDeck] = useState<string | undefined>();
  const [opponentDeck, setOpponentDeck] = useState<string | undefined>();
  const [result, setResult] = useState<string | undefined>();

  const handlePocketGameAdd = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from('pocket_games').insert({
      user: userId,
      deck: myDeck,
      opp_deck: opponentDeck,
      result
    }).select();

    if (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message,
      })
    }

    if (data) {
      mutate(['pocket-games', userId], data);

      setMyDeck(undefined);
      setOpponentDeck(undefined);
      setResult(undefined);
    }
  }, [userId, myDeck, opponentDeck, result]);

  return (
    <Dialog>
      <DialogTrigger className="text-sm"><Button size='sm'><PlusIcon className="size-4 mr-1" />Add match</Button></DialogTrigger>
      <DialogContent onInteractOutside={(e) => {
          e.preventDefault();
        }}>
        <DialogHeader>
          <DialogTitle>Add Pocket match</DialogTitle>
        </DialogHeader>
        <div>
          <Label>My deck</Label>
          <AddArchetype archetype={myDeck} setArchetype={setMyDeck} />
        </div>
        <div>
          <Label>{`Opponent's deck`}</Label>
          <AddArchetype archetype={opponentDeck} setArchetype={setOpponentDeck} />
        </div>
        <div>
          <Label>Result</Label>
          <ToggleGroup
            type='single'
            value={result}
            onValueChange={setResult}
          >
            <ToggleGroupItem value="W">W</ToggleGroupItem>
            <ToggleGroupItem value="L">L</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <DialogFooter>
          <DialogClose asChild disabled={!myDeck || !opponentDeck || !result} onClick={handlePocketGameAdd}>
            <Button>Add</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}