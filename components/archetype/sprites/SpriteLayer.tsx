import { Sprite } from "./Sprite";

interface SpriteLayerProps {
  decks: string[];
}

export const SpriteLayer = (props: SpriteLayerProps) => {
  const decks = props.decks.filter((deck) => deck);

  //@TODO: How can we make this look nicer? Maybe a divider icon?
  return (
    <div className="flex items-center">
      {decks.map((deck, index) => (
        <div key={deck} className="flex items-center">
          <span className="-mr-3"><Sprite name={deck} /></span>
          {index < decks.length - 1 && <span className="mx-1"></span>}
        </div>
      ))}
    </div>
  );
};