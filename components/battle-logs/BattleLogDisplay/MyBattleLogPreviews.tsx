'use client';

import { useRecoilValue } from 'recoil';
import { logState, userState } from '@/app/state/atoms';  // Import Recoil atoms
import { BattleLogSortBy } from "../utils/battle-log.types";
import { BattleLogsByDay } from "../BattleLogGroups/BattleLogsByDay";
import { BattleLogsByDeck } from "../BattleLogGroups/BattleLogsByDeck";
import { Label } from "@/components/ui/label";
import { EditableBattleLogPreview } from "./EditableBattleLogPreview";
import { BattleLogsByMatchupPremium } from "../BattleLogGroups/BattleLogsByMatchup/BattleLogsByMatchupPremium";

interface MyBattleLogPreviewsProps {
  sortBy: BattleLogSortBy;
  isEditing: boolean;
}

export function MyBattleLogPreviews (props: MyBattleLogPreviewsProps) {
  const battleLogs = useRecoilValue(logState);
  const userData = useRecoilValue(userState);

  if (!userData || !battleLogs) {
    return <div>No data available</div>;
  }

  if (props.sortBy === 'Day') {
    return <BattleLogsByDay battleLogs={battleLogs} userData={userData} isEditing={props.isEditing} />;
  }

  if (props.sortBy === 'Deck') {
    return <BattleLogsByDeck battleLogs={battleLogs} userData={userData} isEditing={props.isEditing} />
  }

  if (props.sortBy === 'Matchups') {
    return <BattleLogsByMatchupPremium battleLogs={battleLogs} userData={userData} isEditing={props.isEditing} />
  }

  return (
    <div className="flex flex-col gap-2">
      <Label className="my-2">{battleLogs.length} total battle logs</Label>
      {battleLogs.map((battleLog) => (
        <EditableBattleLogPreview
          key={battleLog.id}
          battleLog={battleLog}
          currentUserScreenName={userData.live_screen_name}
          isEditing={props.isEditing}
        />
      ))}
    </div>
  );
}
