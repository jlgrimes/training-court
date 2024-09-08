import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { Database } from "@/database.types";
import { toast } from "../ui/use-toast";

interface TournamentNameEditProps {
  tournament: Database['public']['Tables']['tournaments']['Row'];
}

export const TournamentNameEdit = ({ tournament }: TournamentNameEditProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tournamentName, setTournamentName] = useState("");

  useEffect(() => {
    if (tournament?.name) {
      setTournamentName(tournament.name);
    } else {
      console.error("Tournament name is missing or undefined.");
    }
  }, [tournament]);

  const handleSave = async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from('tournaments').update({ name: tournamentName }).eq('id', tournament.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Tournament name was not saved.",
        description: error.message,
      })
    } else if (data) {
      toast({
        title: "Tournament name was saved correctly.",
      })
      setIsEditing(false);
    }
  };

  return (
    <div>
      {isEditing ? (
        <div className="flex gap-2 items-center">
          <input
            className="border rounded px-2 py-1"
            value={tournamentName}
            onChange={(e) => setTournamentName(e.target.value)}
          />
          <Button onClick={handleSave}>Save</Button>
          <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
        </div>
      ) : (
        <h1
          className="scroll-m-20 text-2xl font-bold tracking-tight"
          onDoubleClick={() => setIsEditing(true)}
        >
          {tournamentName ? tournamentName : "Loading..."}
        </h1>
      )}
    </div>
  );
};
