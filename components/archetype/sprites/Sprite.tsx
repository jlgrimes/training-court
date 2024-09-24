import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../../ui/hover-card";
import { SpriteFromUrl } from "./SpriteFromUrl";
import { pkmnToImgSrc } from "./sprites.utils";
import { useMemo } from "react";

interface SpriteProps {
  name: string | null | undefined;
  faded?: boolean;
  small?: boolean;
}

export const Sprite = (props: SpriteProps) => {
  const nameSplit = useMemo(() => props.name?.split(','), [props.name]);

  return nameSplit ? (
    <div className="flex items-center gap-1">
      {nameSplit.map((name) => (
        <SpriteFromUrl url={pkmnToImgSrc(name)} />
      ))}
    </div>
  ) : <SpriteFromUrl url={undefined} />;
}