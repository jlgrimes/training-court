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

export default function Header() {
  return (
    <header className="sticky z-50 flex flex-col px-4 py-4 gap-2">
      <div className="flex justify-between">
        <Link href={'/home'}>
          <div className="px-4 py-2 font-semibold text-slate-800">Buddy Poffin</div>
        </Link>
        <NavigationMenu>
          <NavigationMenuList>
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
      <HeaderBreadcrumbs />
    </header>
  );
}
