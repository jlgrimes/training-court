import Link from "next/link";
import { fetchCurrentUser } from "../auth.utils"
import { NavigationMenuLink, navigationMenuTriggerStyle } from "../ui/navigation-menu";
import { LogOutButton } from "./LogOutButton";

export const LogInOut = async () => {
  const user = await fetchCurrentUser();

  if (!user) {
    return (
      <Link href="/login" legacyBehavior passHref>
        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
          Log in
        </NavigationMenuLink>
      </Link>
    )
  }

  return (
    <LogOutButton />
  )
}