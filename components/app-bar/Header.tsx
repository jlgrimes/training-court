import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { MyProfileAvatar } from "./MyProfileAvatar";
import HeaderBreadcrumbs from "./HeaderBreadcrumbs";
import { AvatarSelector } from "../avatar/AvatarSelector";
import { LogInOut } from "./LogInOut";
import { ReportBugDialog } from "./ReportBugDialog";
import { fetchCurrentUser } from "../auth.utils";

export default async function Header() {
  const user = await fetchCurrentUser();

  return (
    <header className="fixed bg-white w-full z-50 flex flex-col px-4 pt-4 gap-2">
      <div className="flex justify-between items-center">
        <Link href={'/home'}>
          <div className="px-4 py-2 font-semibold text-sm sm:text-md text-slate-800">Training Court</div>
        </Link>
        <NavigationMenu>
          <NavigationMenuList>
            {user && (
              <NavigationMenuItem>
                <ReportBugDialog user={user} />
              </NavigationMenuItem>
            )}
            <NavigationMenuItem>
              <Link href="/about" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  About
                </NavigationMenuLink>     
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <LogInOut />
            </NavigationMenuItem>
            {/* <NavigationMenuItem>
              <AvatarSelector />
            </NavigationMenuItem> */}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      <Separator />
    </header>
  );
}
