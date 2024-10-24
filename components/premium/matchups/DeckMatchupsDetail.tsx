'use client';

import { Card, CardContent, CardHeader, CardTitle, SmallCardHeader } from "@/components/ui/card";
import { DeckMatchup } from "./Matchups.types";
import { MatchupsSortState } from "./sort/sort.types";
import { useState } from "react";
import { Sprite } from "@/components/archetype/sprites/Sprite";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { capitalizeName } from "@/components/battle-logs/utils/battle-log.utils";
import { MatchupsTable } from "./MatchupsTable";

interface DeckMatchupDetailProps {
  deckName: string;
  deckMatchup: DeckMatchup;
  handleExitDetailView: () => void;
}

export const DeckMatchupsDetail = (props: DeckMatchupDetailProps) => {
  return (
    <div>
      <Card>
        <div className="pl-4 pt-2">
          <Button variant='ghost' className="text-muted-foreground" onClick={props.handleExitDetailView}>
            <ChevronLeft className="h-4 w-4 mr-2" /> All matchups
          </Button>
        </div>
        <CardHeader className="items-start">
          <CardTitle className="flex items-center gap-4"><Sprite name={props.deckName} />{capitalizeName(props.deckName)}</CardTitle>
        </CardHeader>
      <CardContent>
      <MatchupsTable
        matchups={Object.entries(props.deckMatchup)}
      />
        </CardContent>
      </Card>
    </div>
  )
}