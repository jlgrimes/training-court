'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, SmallCardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/utils/supabase/client";
import { EditIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react"

interface NotesProps {
  logId: string;
  serverLoadedNotes: string | null;
}

export const Notes = (props: NotesProps) => {
  const [renderedNotes, setRenderedNotes] = useState(props.serverLoadedNotes);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setRenderedNotes(props.serverLoadedNotes);
  }, [props.serverLoadedNotes]);

  const handleSave = useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase.from('logs').update({ notes: renderedNotes }).eq('id', props.logId);

    if (error) {
      console.error(error);
    }
    setIsEditing(false);
  }, [renderedNotes]);

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>Notes</CardTitle>
        <Button size='sm' variant='ghost' onClick={() => setIsEditing(!isEditing)}><EditIcon className="h-4 w-4" /></Button>
      </CardHeader>
      <CardContent>
        {isEditing ? <Textarea autoFocus maxLength={500} value={renderedNotes ?? ''} onChange={(e) => setRenderedNotes(e.target.value)} /> : <p className="whitespace-pre-wrap">{renderedNotes}</p>}
      </CardContent>
      {isEditing && (
        <CardFooter>
          <Button size='sm' onClick={handleSave}>Save</Button>
        </CardFooter>
      )}
    </Card>
  )
}