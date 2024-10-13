import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../../ui/hover-card";
import { SpriteFromUrl } from "./SpriteFromUrl";
import { pkmnToImgSrc } from "./sprites.utils";
import { useMemo } from "react";
import { uncapitalizeName } from "@/components/battle-logs/utils/battle-log.utils";

interface SpriteProps {
  name: string | null | undefined;
  faded?: boolean;
  small?: boolean;
  shouldSmush?: boolean;
}

export const Sprite = (props: SpriteProps) => {
  const nameSplit = useMemo(() => {
    // this code 're-normalizes' the deck name to lowercase and with appropriate dashes for hyphenated Pokemon.
    // It's necessary for legacy implementation. 10/12/2024
    return props.name ? uncapitalizeName(props.name).split(',').map((name) => name.trim()) : ['null'];
  }, [props.name]);

  return (
    <div className={cn(
      "flex items-center",
      props.shouldSmush ? 'flex-col xl:flex-row xl:gap-1' : 'gap-1'
    )}>
      {nameSplit.map((name, index) => (
        <SpriteFromUrl key={index + name} url={pkmnToImgSrc(name)} />
      ))}
    </div>
  );
};
