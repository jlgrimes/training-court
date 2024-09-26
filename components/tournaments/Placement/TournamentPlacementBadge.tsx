import { Badge } from "@/components/ui/badge";
import { TournamentPlacement, renderTournamentPlacement } from "./tournament-placement.types";

interface TournamentPlacementBadgeProps {
  placement: TournamentPlacement;
}

export const TournamentPlacementBadge = (props: TournamentPlacementBadgeProps) => {
  if(props.placement !== 'no placement' && props.placement !== null) {
      return (
        <div>
        <Badge variant='outline' className="py-1">
          {renderTournamentPlacement(props.placement)}
        </Badge>
      </div>
    )
  }
}