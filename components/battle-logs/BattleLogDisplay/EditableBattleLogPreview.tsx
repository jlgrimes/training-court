import { BattleLogPreview, BattleLogPreviewProps } from "./BattleLogPreview";
import { cn } from "@/lib/utils";
import { BattleLogDeleteButton } from "./BattleLogEdit/BattleLogDeleteButton";
import { BattleLogEditButton } from "./BattleLogEdit/BattleLogEditButton";

interface EditableBattleLogPreviewProps extends BattleLogPreviewProps {
  isEditing: boolean;
  userId: string;
}

export const EditableBattleLogPreview = (props: EditableBattleLogPreviewProps) => {
  return (
    <div className="relative flex items-center gap-2">
      <div className={cn(
        props.isEditing ? 'w-5/6' : 'w-full',
        'transition-all ease-out'
      )}>
        <BattleLogPreview battleLog={props.battleLog} currentUserScreenName={props.currentUserScreenName} />
      </div>
      <BattleLogEditButton isEditing={props.isEditing} log={props.battleLog} userId={props.userId} />
      <BattleLogDeleteButton isEditing={props.isEditing} logId={props.battleLog.id} />
    </div>
  )
}
