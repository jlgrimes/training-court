import { Button } from "@/components/ui/button";
import { BattleLogPreview, BattleLogPreviewProps } from "./BattleLogPreview";
import { TrashIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback, useMemo, useState } from "react";
import { BattleLogDeleteButton } from "./BattleLogEdit/BattleLogDeleteButton";
import { BattleLogEditButton } from "./BattleLogEdit/BattleLogEditButton";

interface EditableBattleLogPreviewProps extends BattleLogPreviewProps {
  isEditing: boolean;
}

export const EditableBattleLogPreview = (props: EditableBattleLogPreviewProps) => {
  const userIsNotInTheBattleLog = useMemo(() => {
    return (props.currentUserScreenName?.toLowerCase() !== props.battleLog.players[0].name.toLowerCase()) && (props.currentUserScreenName?.toLowerCase() !== props.battleLog.players[1].name.toLowerCase());
  }, [props.battleLog.players[0].name, props.battleLog.players[1].name, props.currentUserScreenName])


  return (
    <div className="relative flex items-center gap-2">
      <div className={cn(
        props.isEditing ? 'w-5/6' : 'w-full',
        'transition-all ease-out'
      )}>
        <BattleLogPreview battleLog={props.battleLog} currentUserScreenName={props.currentUserScreenName} />
      </div>
      <BattleLogEditButton isEditing={props.isEditing} log={props.battleLog} currentPlayer={(props.battleLog.players[0].name.toLowerCase() === props.currentUserScreenName?.toLowerCase()) ? props.battleLog.players[0] : props.battleLog.players[1]}
        shouldDisable={userIsNotInTheBattleLog} />
      <BattleLogDeleteButton isEditing={props.isEditing} logId={props.battleLog.id} />
    </div>
  )
}