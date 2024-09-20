import { Earth, MapPinHouse, Plane, Swords, Trees, Trophy } from "lucide-react";
import { TournamentCategory } from "./tournament-category.types"

interface TournamentCategoryIconProps {
  category: TournamentCategory;
}

export const TournamentCategoryIcon = (props: TournamentCategoryIconProps) => {
  const commonClassName = "h-4 w-4 mr-2";

  switch (props.category) {
    case 'local':
      return <MapPinHouse className={commonClassName} />
    case 'challenge':
      return <Swords className={commonClassName} />
    case 'cup':
      return <Trophy className={commonClassName} />;
    case 'regional':
      return <Trees className={commonClassName} />;
    case 'international':
      return <Plane className={commonClassName} />
    case 'world':
      return <Earth className={commonClassName} />
  }
}