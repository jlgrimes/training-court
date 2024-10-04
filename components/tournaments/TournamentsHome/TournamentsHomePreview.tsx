import { createClient } from "@/utils/supabase/server";
import { User } from "@supabase/supabase-js";
import TournamentPreview from "../Preview/TournamentPreview";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { Database } from "@/database.types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import TournamentCreate from "../TournamentCreate";
import { SeeMoreButton } from "@/components/SeeMoreButton";

interface MyTournamentPreviewsProps {
  user: User | null;
}

export async function TournamentsHomePreview (props: MyTournamentPreviewsProps) {
  const supabase = createClient();
  const { data: tournamentData } = await supabase.from('tournaments').select('*').eq('user', props.user?.id).order('date_from', { ascending: false }).limit(3).returns<Database['public']['Tables']['tournaments']['Row'][]>();

  if (!props.user) {
    return null;
  }

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
    <div className="flex flex-col gap-6">
      <Link href='/tournaments'>
        <h1 className="text-xl tracking-wide font-semibold text-slate-800">Tournaments</h1>
      </Link>
      <div className="flex flex-col gap-2">
        {tournamentData?.map((tournament) => (
          <TournamentPreview tournament={tournament} />
        ))}
        <SeeMoreButton href="/tournaments" />
      </div>
      <TournamentCreate userId={props.user.id} />
    </div>
  )
}