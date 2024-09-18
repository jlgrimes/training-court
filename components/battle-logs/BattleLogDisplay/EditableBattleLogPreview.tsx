import { Button } from "@/components/ui/button";
import { BattleLogPreview, BattleLogPreviewProps } from "./BattleLogPreview";
import { TrashIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";
import { BattleLogDeleteButton } from "./BattleLogEdit/BattleLogDeleteButton";

interface EditableBattleLogPreviewProps extends BattleLogPreviewProps {
  isEditing: boolean;
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
      <BattleLogDeleteButton isEditing={props.isEditing} logId={props.battleLog.id} />
    </div>
  )
}