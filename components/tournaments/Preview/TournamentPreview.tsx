
import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { getRecord } from "../utils/tournaments.utils";
import { Sprite } from "../../archetype/Sprite";
import { fetchRounds } from "../utils/tournaments.server.utils";

export default async function TournamentPreview({ id, name, date_from, date_to, deck }: { id: string, name: string, date_from: Date, date_to: Date, deck: string }) {
  const rounds = await fetchRounds(id);

  return (
    <Link href={`/tournament/${id}`}>
      <Card clickable>
        <CardHeader className="grid grid-cols-6 items-center">
          {deck ? <Sprite name={deck} /> : <div></div>}
          <div className="col-span-5 grid-cols-5">
            <CardTitle>{name}</CardTitle>
            <CardDescription className="grid gap-4">
              {rounds && getRecord(rounds)}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </Link>
  )
}