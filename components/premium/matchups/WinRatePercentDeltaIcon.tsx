import { ArrowDown, ArrowUp, Minus } from "lucide-react";

interface WinRatePercentDeltaIconProps {
  initialWinRate: number;
  modifiedWinRate: number;
}

export const WinRatePercentDeltaIcon = (props: WinRatePercentDeltaIconProps) => {
  if (props.modifiedWinRate > props.initialWinRate) {
    return <ArrowUp className="h-4 w-4 stroke-green-600" />;
  }

  if (props.modifiedWinRate < props.initialWinRate) {
    return <ArrowDown className="w-4 h-4 stroke-red-600" />
  }

  return <Minus className="h-4 w-4" />;
}