import { cn } from "@/lib/utils";
import { CircleHelpIcon, HelpCircle } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../../ui/hover-card";
import { SpriteFromUrl } from "./SpriteFromUrl";
import { pkmnToImgSrc } from "./sprites.utils";
import { useMemo } from "react";
import { uncapitalizeName } from "@/components/battle-logs/utils/battle-log.utils";
import { HatType, hatOverlays } from "./hats/hats.config";

interface SpriteProps {
  name: string | null | undefined;
  faded?: boolean;
  small?: boolean;
  shouldSmush?: boolean;
  shouldFill?: boolean; // should fill with empty space. if < 2 sprites. good for alignment!
  hatType?: string | null;
}

export const Sprite = (props: SpriteProps) => {
  const nameSplit = useMemo(() => {
    // this code 're-normalizes' the deck name to lowercase and with appropriate dashes for hyphenated Pokemon.
    // It's necessary for legacy implementation. 10/12/2024
    return props.name ? uncapitalizeName(props.name).split(',').map((name) => name.trim()) : [null];
  }, [props.name]);

  return (
    <div className={cn(
      "flex items-center",
      props.shouldSmush ? 'flex-col xl:flex-row xl:gap-1' : 'gap-1',
      props.shouldFill && 'w-[80px]'
    )}>
      {props.name === 'unknown' || props.name === null ? (
        <CircleHelpIcon/>
      ) : (
        nameSplit.map((name, index) => {
          const hatBase = props.hatType ? hatOverlays[props.hatType as HatType] : undefined;
          const normalized = name?.toLowerCase() ?? '';
          const hatOverride = hatBase?.perPokemon?.[normalized];
          const hat = hatBase
            ? {
                src: hatOverride?.src ?? hatBase.src,
                offsetX: hatOverride?.offsetX ?? hatBase.offsetX,
                offsetY: hatOverride?.offsetY ?? hatBase.offsetY,
                scale: hatOverride?.scale ?? hatBase.scale,
              }
            : undefined;

          return (
            <SpriteFromUrl
              key={index}
              url={pkmnToImgSrc(name)}
              small={props.small}
              hatSrc={hat?.src}
              hatOffsetX={hat?.offsetX}
              hatOffsetY={hat?.offsetY}
              hatScale={hat?.scale}
            />
          );
        })
      )}
    </div>
  );
};
