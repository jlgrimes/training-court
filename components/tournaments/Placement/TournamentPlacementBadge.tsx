import { Badge } from "@/components/ui/badge";
import { TournamentPlacement, renderTournamentPlacement } from "./tournament-placement.types";

interface TournamentPlacementBadgeProps {
  placement: TournamentPlacement;
}

export const TournamentPlacementBadge = (props: TournamentPlacementBadgeProps) => {
  return (
    <div>
      <Badge variant='outline' className="py-1 mt-2">
        {renderTournamentPlacement(props.placement)}
      </Badge>
    </div>
  )
}