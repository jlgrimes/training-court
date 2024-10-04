import { ChevronRightIcon } from "lucide-react"
import { Button } from "./ui/button"
import Link from "next/link";

interface SeeMoreButtonProps {
  href: string;
}

export const SeeMoreButton = (props: SeeMoreButtonProps) => {
  return (
    <div>
      <Button asChild variant='ghost'>
        <Link href={props.href}>
          See more <ChevronRightIcon className="h-4 w-4 ml-2" />
        </Link>
      </Button>
    </div>
  )
}