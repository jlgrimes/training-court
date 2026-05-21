import { ChevronRightIcon } from "lucide-react"
import { Button } from "./ui/button"
import Link from "next/link";
import { TranslatedText } from "./general-translation/TranslatedText";

interface SeeMoreButtonProps {
  href: string;
}

export const SeeMoreButton = (props: SeeMoreButtonProps) => {
  return (
    <div>
      <Button asChild variant='ghost'>
        <Link href={props.href}>
          <TranslatedText id="common.seeMore">See more</TranslatedText> <ChevronRightIcon className="h-4 w-4 ml-2" />
        </Link>
      </Button>
    </div>
  )
}
