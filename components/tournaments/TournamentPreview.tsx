
import Link from "next/link";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle } from "../ui/card";

export default async function TournamentPreview({ id, name, date_from, date_to }: { id: string, name: string, date_from: Date, date_to: Date }) {
  return (
    <Link href={`/tournament/${id}`}>
      <Card>
        <CardHeader>
          <CardTitle>{name}</CardTitle>
        </CardHeader>
      </Card>
    </Link>
  )
}