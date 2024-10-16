import { BattleLogPreview, BattleLogPreviewProps } from "./BattleLogPreview";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { BattleLogDeleteButton } from "./BattleLogEdit/BattleLogDeleteButton";
import { BattleLogEditButton } from "./BattleLogEdit/BattleLogEditButton";
import { useRecoilValue } from "recoil";
import { userState } from "@/app/state/atoms";

interface EditableBattleLogPreviewProps extends BattleLogPreviewProps {
  isEditing: boolean;
}

export const EditableBattleLogPreview = (props: EditableBattleLogPreviewProps) => {
  const userData = useRecoilValue(userState);

  const userIsNotInTheBattleLog = useMemo(() => {
    return (
      userData?.live_screen_name?.toLowerCase() !== props.battleLog.players[0].name.toLowerCase() &&
      userData?.live_screen_name?.toLowerCase() !== props.battleLog.players[1].name.toLowerCase()
    );
  }, [props.battleLog.players[0].name, props.battleLog.players[1].name, userData?.live_screen_name]);

  return (
    <div className="relative flex items-center gap-2">
      <div className={cn(
        props.isEditing ? 'w-5/6' : 'w-full',
        'transition-all ease-out'
      )}>
        <BattleLogPreview battleLog={props.battleLog} />
      </div>
      <BattleLogEditButton isEditing={props.isEditing} log={props.battleLog} currentPlayer={(props.battleLog.players[0].name.toLowerCase() === props.currentUserScreenName?.toLowerCase()) ? props.battleLog.players[0] : props.battleLog.players[1]}
        shouldDisable={userIsNotInTheBattleLog} />
      <BattleLogDeleteButton isEditing={props.isEditing} logId={props.battleLog.id} />
    </div>
  )
}