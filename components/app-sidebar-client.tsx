'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Atom, BriefcaseBusiness, Calendar, ChevronUp, Home, Inbox, Info, LogIn, ScrollText, Search, Settings, ToggleLeft, ToggleRight, Trophy, WalletMinimal } from "lucide-react";
import Image from "next/image";
import { ReportBugDialog } from "./app-bar/ReportBugDialog";
import Link from "next/link";
import { MyProfileAvatar } from "./app-bar/MyProfileAvatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { LogOutButton } from "./app-bar/LogOutButton";
import { DarkModeToggle } from "./theme/DarkModeToggle";
import { useAuth } from "@/app/recoil/hooks/useAuth";
import { useFriends } from "@/app/recoil/hooks/useFriends";
import { useNotifications } from "@/app/recoil/hooks/useNotifications";

const items = [
  {
    title: "About",
    url: "/about",
    icon: Info,
  }
];

const tcgItems = [
  {
    title: "Battle Logs",
    url: "/logs",
    icon: ScrollText,
  },
  {
    title: "Tournaments",
    url: "/tournaments",
    icon: Trophy,
  },
];

const pocketItems = [
  {
    title: "Games",
    url: "/pocket",
    icon: WalletMinimal,
  }
];

export function AppSidebarClient() {
  const { user, isAuthenticated, isPremium, isAdmin } = useAuth();
  const { pendingCount: friendRequestCount } = useFriends();
  const { unreadCount: notificationCount } = useNotifications();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between w-full px-2 py-1">
          <Link href={isAuthenticated ? '/home' : '/'}>
            <Image
              src={'/logo.png'}
              alt='logo'
              width={150}
              height={20}
              className="dark:invert"
            />
          </Link>

          {isPremium && <DarkModeToggle />}
        </div>
        <SidebarSeparator />
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {isAuthenticated && user && (
            <SidebarMenuItem>
              <ReportBugDialog user={user} />
            </SidebarMenuItem>
          )}
          {!isAuthenticated && (
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href='/login'>
                    <LogIn />
                    <span>Log In</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
        </SidebarMenu>
      </SidebarHeader>
      
      {isAuthenticated && (
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Trading Card Game</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {tcgItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          <SidebarGroup>
            <SidebarGroupLabel>Pocket</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {pocketItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          {/* Friends & Notifications */}
          <SidebarGroup>
            <SidebarGroupLabel>Social</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href='/friends'>
                      <BriefcaseBusiness />
                      <span>Friends</span>
                      {friendRequestCount > 0 && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                          {friendRequestCount}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href='/notifications'>
                      <Inbox />
                      <span>Notifications</span>
                      {notificationCount > 0 && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                          {notificationCount}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          {isAdmin && (
            <SidebarGroup>
              <SidebarGroupLabel>Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href='/admin'>
                        <Atom />
                        <span>admin stuff</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>
      )}
      
      <SidebarFooter>
        {isAuthenticated && user && (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <MyProfileAvatar user={user} /> {user?.email}
                    <ChevronUp className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  className="w-[--radix-popper-anchor-width]"
                >
                  <DropdownMenuItem asChild>
                    <Link href='/preferences'>
                      Preferences
                    </Link>
                  </DropdownMenuItem>
                  <LogOutButton />
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}