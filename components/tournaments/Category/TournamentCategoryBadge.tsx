import { Badge } from "@/components/ui/badge";
import { TournamentCategoryIcon } from "./TournamentCategoryIcon"
import { TournamentCategory, displayTournamentCategory } from "./tournament-category.types"

interface TournamentCategoryBadgeProps {
  category: TournamentCategory;
}

export const TournamentCategoryBadge = (props: TournamentCategoryBadgeProps) => {
  return (
    <div>
      <Badge variant='outline' className="py-1">
        <div className="flex items-center pl-1">
          <TournamentCategoryIcon category={props.category} />
          <p>{displayTournamentCategory(props.category)}</p>
        </div>
      </Badge>
    </div>
  )
}