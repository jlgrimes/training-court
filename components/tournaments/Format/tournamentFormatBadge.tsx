import { Badge } from "@/components/ui/badge";
import { FormatArray } from "./tournament-format.types";

interface TournamentCategoryBadgeProps {
  format: FormatArray;
}

export const TournamentFormatBadge = (props: TournamentCategoryBadgeProps) => {
  return (
    <div>
      <Badge variant='outline' className="py-1">
        <div className="flex items-center pl-1">
          <p>{props.format}</p>
        </div>
      </Badge>
    </div>
  )
}