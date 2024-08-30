
import Link from "next/link";
import { Button } from "../ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { fetchRounds, fetchTournament, getRecord } from "./tournaments.utils";
import { Sprite } from "../archetype/Sprite";

export default async function TournamentPreview({ id, name, date_from, date_to, deck }: { id: string, name: string, date_from: Date, date_to: Date, deck: string }) {
  const rounds = await fetchRounds(id);

  return (
    <Link href={`/tournament/${id}`}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg tracking-normal">{name}</CardTitle>
          <CardDescription className="grid grid-cols-4 gap-4 text-lg font-semibold tracking-wider">
            {deck && <Sprite name={deck} />}
            {rounds && getRecord(rounds)}
            </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}