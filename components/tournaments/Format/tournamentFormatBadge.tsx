import { Badge } from "@/components/ui/badge";
import { FormatArray } from "./tournament-format.types";

interface TournamentFormatBadgeProps {
  format: FormatArray;
}

export const TournamentFormatBadge = (props: TournamentFormatBadgeProps) => {
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