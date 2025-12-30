import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../../ui/hover-card";

interface SpriteProps {
  url: string | null | undefined;
  faded?: boolean;
  small?: boolean;
  hatSrc?: string;
  hatOffsetX?: number;
  hatOffsetY?: number;
  hatScale?: number;
}

export const SpriteFromUrl = (props: SpriteProps) => {
  if (!props.url) return (
    <HoverCard>
      <HoverCardTrigger className="flex justify-center w-[40px]" ><HelpCircle className="h-6 w-6 stroke-slate-600" /></HoverCardTrigger>
      <HoverCardContent>
        Deck is unknown. Report this in the "Feedback" tab so we can add it!
      </HoverCardContent>
    </HoverCard>
  );

  const sizeClass = props.small ? 'h-[27px] w-[27px]' : 'h-[40px] w-[40px]';
  return (
    <div className="relative inline-flex">
      <img src={props.url} alt={props.url} className={cn(
        'pixel-image',
        props.faded && 'opacity-40',
        sizeClass,
        'object-contain'
      )} />
      {props.hatSrc && (
        <img
          src={props.hatSrc}
          alt="hat"
          className="pointer-events-none absolute"
          style={{
            transform: `translate(${props.hatOffsetX ?? 0}px, ${props.hatOffsetY ?? 0}px) scale(${props.hatScale ?? 1})`,
            transformOrigin: 'top left',
          }}
        />
      )}
    </div>
  )
}
