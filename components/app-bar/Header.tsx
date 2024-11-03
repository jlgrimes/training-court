import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { LogInOut } from "./LogInOut";
import { ReportBugDialog } from "./ReportBugDialog";
import { fetchCurrentUser } from "../auth.utils";
import Image from "next/image";
import { AuthIcon } from "./AuthIcon";
import { SidebarTrigger } from "../ui/sidebar";

export default async function Header() {
  const user = await fetchCurrentUser();

  return (
    <header className="fixed bg-white w-full z-50 flex flex-col px-4 pt-4 gap-2">
      <div className="flex justify-between items-center">
        {/* <Link href={'/home'}>
          <Image src={'/logo.png'} alt='logo' width={150} height={20} />
        </Link> */}
        <SidebarTrigger />
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
              <AuthIcon user={user} />
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      <Separator />
    </header>
  );
}
