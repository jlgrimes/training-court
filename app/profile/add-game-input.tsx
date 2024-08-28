'use client';

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { useCallback, useMemo, useState } from "react";

interface AddGameInputProps {
  user: User;
}

export const AddGameInput = (props: AddGameInputProps) => {
  const [log, setLog] = useState('');
  const { toast } = useToast();

  const handleAddButtonClick = async () => {
    const supabase = createClient();

    if (!props.user.email) return console.error('No email specified, for some reason.');

    const { error } = await supabase.from('logs').insert({
      user: props.user.id,
      log: log
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message,
      })
    } else {
      toast({
        title: "You did it!",
      })
    }
  };

  const isAddButtonDisabled = useMemo(() => {
    return log.length === 0;
  }, [log]);

  return (
    <div>
      <Textarea value={log} onChange={(e) => setLog(e.target.value)} />
      <Button onClick={handleAddButtonClick} disabled={isAddButtonDisabled}>Add new game</Button>
    </div>
  )
}