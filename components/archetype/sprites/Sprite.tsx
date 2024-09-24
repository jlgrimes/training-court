import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../../ui/hover-card";

interface SpriteProps {
  name: string | null | undefined;
  faded?: boolean;
  small?: boolean;
}

export const Sprite = (props: SpriteProps) => {
  if (!props.name) return (
    <HoverCard>
      <HoverCardTrigger className="flex justify-center w-[40px]" ><HelpCircle className="h-6 w-6 stroke-slate-600" /></HoverCardTrigger>
      <HoverCardContent>
        Deck is unknown. Report this in the "Feedback" tab so we can add it!
      </HoverCardContent>
    </HoverCard>
  );

  return (
    <img src={`https://limitlesstcg.s3.us-east-2.amazonaws.com/pokemon/gen9/${props.name}.png`} height={30} width={'auto'} alt={props.name} className={cn(
      'pixel-image',
      props.faded && 'opacity-40',
      props.small ? 'h-[27px] w-[27px]' : 'h-[40px] w-[40px]',
      'object-contain'
    )} />
  )
}