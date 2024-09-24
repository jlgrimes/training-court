import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../../ui/hover-card";
import { SpriteFromUrl } from "./SpriteFromUrl";
import { pkmnToImgSrc } from "./sprites.utils";

interface SpriteProps {
  name: string | null | undefined;
  faded?: boolean;
  small?: boolean;
}

export const Sprite = (props: SpriteProps) => {
  return props.name && <SpriteFromUrl url={pkmnToImgSrc(props.name)} />
}