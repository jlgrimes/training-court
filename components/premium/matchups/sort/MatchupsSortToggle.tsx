import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ArrowDown10, ArrowDownWideNarrow, ArrowUp01, ArrowUpNarrowWide, Binary, Clock, ClockArrowDown, ClockArrowUp, ListFilter } from "lucide-react";
import { useCallback } from "react";
import { CardDescription } from "@/components/ui/card";
import { MatchupsSortBy, MatchupsSortState } from "./sort.types";
import { stringifySort } from "./sort.utils";

interface MatchupsSortToggleProps {
  sort: MatchupsSortState;
  setSort: (val: MatchupsSortState) => void;
}

export const MatchupsSortToggle = (props: MatchupsSortToggleProps) => {
  const handleSortChange = useCallback((val: string) => {
    const newSortBy = (val !== '') ? val as unknown as MatchupsSortBy : props.sort.by;
    const newSortType = (newSortBy === props.sort.by) ? ((props.sort.type === 'asc') ? 'desc' : 'asc') : 'desc';

    props.setSort({
      by: newSortBy,
      type: newSortType
    });
  }, [props.sort]);

  return (
    <div className="flex justify-between items-center gap-2">
      <ToggleGroup
        type='single'
        value={props.sort.by}
        onValueChange={handleSortChange}
      >
        <ToggleGroupItem value='amount-played'>
          {props.sort.by !== 'amount-played' && <ListFilter className="h-4 w-4" />}
          {props.sort.by === 'amount-played' && props.sort.type === 'desc' && <ArrowDownWideNarrow className="h-4 w-4" />}
          {props.sort.by === 'amount-played' && props.sort.type === 'asc' && <ArrowUpNarrowWide className="h-4 w-4" />}
        </ToggleGroupItem>
        <ToggleGroupItem value='last-played'>
          {props.sort.by !== 'last-played' && <Clock className="h-4 w-4" />}
          {props.sort.by === 'last-played' && props.sort.type === 'desc' && <ClockArrowDown className="h-4 w-4" />}
          {props.sort.by === 'last-played' && props.sort.type === 'asc' && <ClockArrowUp className="h-4 w-4" />}
        </ToggleGroupItem>
        <ToggleGroupItem value='win-rate'>
          {props.sort.by !== 'win-rate' && <Binary className="h-4 w-4" />}
          {props.sort.by === 'win-rate' && props.sort.type === 'desc' && <ArrowDown10 className="h-4 w-4" />}
          {props.sort.by === 'win-rate' && props.sort.type === 'asc' && <ArrowUp01 className="h-4 w-4" />}
        </ToggleGroupItem>
      </ToggleGroup>
      <CardDescription>
        {stringifySort(props.sort)}
      </CardDescription>
    </div>
  )
}