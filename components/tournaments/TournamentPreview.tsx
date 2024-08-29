
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle } from "../ui/card";

export default async function TournamentPreview({ name, date_from, date_to }: { name: string, date_from: Date, date_to: Date }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
      </CardHeader>
    </Card>
  )
}