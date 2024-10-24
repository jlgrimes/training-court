import { Button } from "@/components/ui/button"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"
import { MatchupsSortType } from "./sort.types";

interface SortColHeaderProps {
  direction: MatchupsSortType | null;
  onClick: () => void;
  children: string;
}

export const SortColHeader = (props: SortColHeaderProps) => {
  return (
    <Button
      variant='ghost'
      size='sm'
      onClick={props.onClick}
    >
      {props.children}
      {props.direction === null && <ChevronsUpDown className="h-4 w-4 ml-2" />}
      {props.direction === 'asc' && <ArrowUp className="h-4 w-4 ml-2" />}
      {props.direction === 'desc' && <ArrowDown className="h-4 w-4 ml-2" />}
    </Button>
  )
}