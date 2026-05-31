import { Badge } from "@/components/ui/badge";

interface TournamentFormatBadgeProps {
  format: string;
}

export const TournamentFormatBadge = (props: TournamentFormatBadgeProps) => {
  return (
    <div>
      <Badge variant='outline' className="py-1 whitespace-nowrap flex">
        <div className="flex items-center pl-1">
          <p>{props.format}</p>
        </div>
      </Badge>
    </div>
  )
}