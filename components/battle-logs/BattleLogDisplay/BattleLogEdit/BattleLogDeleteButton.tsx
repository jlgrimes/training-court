'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { TrashIcon } from "lucide-react";
import { useCallback } from "react";

interface BattleLogDeleteButtonProps {
  isEditing: boolean;
  logId: string;
}

export const BattleLogDeleteButton = (props: BattleLogDeleteButtonProps) => {
  const { toast } = useToast();
  
  const handleDeleteTournament = useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase.from('logs').delete().eq('id', props.logId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong with deleting the log.",
        description: error.message,
      })
    } else {
      window.location.href = '/logs';
    }
  }, [toast]);

  return (
    <Dialog>
      <DialogTrigger disabled={!props.isEditing} className={
        cn(
          "absolute right-2 transition-opacity ease-in duration-75",
          !props.isEditing && 'hidden',
        )
      }>
        <TrashIcon className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete log</DialogTitle>
        </DialogHeader>
          <p>
            Are you sure you want to delete this log?
          </p>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant={'secondary'}>Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant={'destructive'} onClick={handleDeleteTournament}>Yes, delete</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}