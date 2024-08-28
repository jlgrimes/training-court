import Image from "next/image"

interface SpriteProps {
  name: string | undefined;
}

export const Sprite = (props: SpriteProps) => {
  if (!props.name) return null;

  return (
    <Image src={`https://limitlesstcg.s3.us-east-2.amazonaws.com/pokemon/gen9/${props.name}.png`} height={40} width={40} alt={props.name} className="pixel-image" />
  )
}