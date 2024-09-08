import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { Database } from "@/database.types";
import { toast } from "../ui/use-toast";
import { Input } from "../ui/input";
import { PencilIcon } from "lucide-react";

interface TournamentNameEditProps {
  tournament: Database['public']['Tables']['tournaments']['Row'];
}

export const TournamentNameEdit = ({ tournament }: TournamentNameEditProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tournamentName, setTournamentName] = useState("");
  const [hovering, setHovering] = useState(false);

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
          <Input
            className="border rounded px-2 py-1"
            value={tournamentName}
            onChange={(e) => setTournamentName(e.target.value)}
            autoFocus
          />
          <Button onClick={handleSave}>Save</Button>
          <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
        </div>
      ) : (
        <div
          className="relative"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          <h1
            className="scroll-m-20 text-2xl font-bold tracking-tight"
          >
            {tournamentName ? tournamentName : "Loading..."}
          </h1>
          {hovering && (
            <PencilIcon
              className="absolute right-0 top-0 cursor-pointer"
              onClick={() => setIsEditing(true)}
            />
          )}
        </div>
      )}
    </div>
  );
};