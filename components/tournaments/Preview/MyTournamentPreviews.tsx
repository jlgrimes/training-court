import { createClient } from "@/utils/supabase/server";
import { User } from "@supabase/supabase-js";
import TournamentPreview from "./TournamentPreview";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";

interface MyTournamentPreviewsProps {
  user: User | null;
}

export async function MyTournamentPreviews (props: MyTournamentPreviewsProps) {
  const supabase = createClient();
  const { data: tournamentData } = await supabase.from('tournaments').select('*').eq('user', props.user?.id).order('date_from', { ascending: false });

  if (tournamentData && tournamentData?.length === 0) {
    return (
      <Card className="border-none">
        <CardHeader className="px-2">
          <CardDescription>You can add tournaments from the past, present, or future.</CardDescription>
          <CardDescription>Click Add Tournament to get started!</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {tournamentData?.map((tournament) => (
        <TournamentPreview tournament={tournament}/>
      ))}
    </div>
  )
}