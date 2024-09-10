import { Sprite } from "./Sprite";

interface SpriteLayerProps {
  decks: string[];
}

export const SpriteLayer = (props: SpriteLayerProps) => {
  return (
    <div className="flex items-center">
      {props.decks.filter((deck) => deck).map((deck) => (
        <span key={deck} className="-mr-3"><Sprite name={deck} /></span>
      ))}
    </div>
  )
}