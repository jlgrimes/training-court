import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EllipsisVertical } from "lucide-react";
import { useState } from "react";

interface MatchupsOptionsProps {
  handleDrillDownChecked: (val: boolean) => void;
  shouldDisableDrillDown: boolean;
}

export const MatchupsOptions = (props: MatchupsOptionsProps) => {
  const [drillDownChecked, setDrillDownChecked] = useState(true);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size='sm'><EllipsisVertical className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Options</DropdownMenuLabel>
        {/* <DropdownMenuSeparator /> */}
        <DropdownMenuCheckboxItem
          defaultChecked={true}
          checked={drillDownChecked}
          onCheckedChange={(val) => {
            setDrillDownChecked(val);
            props.handleDrillDownChecked(val);
          }}
          disabled={props.shouldDisableDrillDown}
        >
          Drill down archetypes
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}