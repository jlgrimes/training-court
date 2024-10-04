import { Earth, Map, MapPinHouse, Plane, Swords, Trophy, Laptop } from "lucide-react";
import { TournamentCategory } from "./tournament-category.types"

interface TournamentCategoryIconProps {
  category: TournamentCategory;
}

export const TournamentCategoryIcon = (props: TournamentCategoryIconProps) => {
  const commonClassName = "h-4 w-4 mr-2 stroke-muted-foreground";

  switch (props.category) {
    case 'online':
      return <Laptop className={commonClassName} />
    case 'local':
      return <MapPinHouse className={commonClassName} />
    case 'challenge':
      return <Swords className={commonClassName} />
    case 'cup':
      return <Trophy className={commonClassName} />;
    case 'regional':
      return <Map className={commonClassName} />;
    case 'international':
      return <Plane className={commonClassName} />
    case 'world':
      return <Earth className={commonClassName} />
  }
}