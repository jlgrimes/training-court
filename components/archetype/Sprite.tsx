interface SpriteProps {
  name: string | null | undefined;
}

export const Sprite = (props: SpriteProps) => {
  if (!props.name) return null;

  return (
    <img src={`https://limitlesstcg.s3.us-east-2.amazonaws.com/pokemon/gen9/${props.name}.png`} height={30} width={'auto'} alt={props.name} className="pixel-image" />
  )
}