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
import { T, useGT } from "gt-react";

export const AddPocketMatch = ({ userId }: { userId: string}) => {
  const { toast } = useToast();
  const gt = useGT();
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
        title: gt("Uh oh! Something went wrong.", { $id: "common.errorTitle" }),
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
      <DialogTrigger className="text-sm"><Button size='sm'><PlusIcon className="size-4 mr-1" /><T id="pocket.addMatch.button">Add match</T></Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle><T id="pocket.addMatch.title">Add Pocket match</T></DialogTitle>
        </DialogHeader>
        <div>
          <Label><T id="pocket.addMatch.myDeck">My deck</T></Label>
          <AddArchetype archetype={myDeck} setArchetype={setMyDeck} />
        </div>
        <div>
          <Label><T id="pocket.addMatch.opponentsDeck">Opponent&apos;s deck</T></Label>
          <AddArchetype archetype={opponentDeck} setArchetype={setOpponentDeck} />
        </div>
        <div>
          <Label><T id="pocket.addMatch.result">Result</T></Label>
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
            <Button><T id="common.add">Add</T></Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
