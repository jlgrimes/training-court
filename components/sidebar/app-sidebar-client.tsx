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
  useSidebar,
} from "@/components/ui/sidebar";
import { Atom, BriefcaseBusiness, Calendar, ChevronLeft, ChevronRight, ChevronUp, Home, Inbox, Info, LogIn, ScrollText, Search, Settings, ToggleLeft, ToggleRight, Trophy, WalletMinimal, Bell, BarChart3, BookOpenCheck, Gamepad2, Users, Moon, Sun, Monitor } from "lucide-react";
import Image from "next/image";
import { ReportBugDialog } from "../app-bar/ReportBugDialog";
import Link from "next/link";
import { MyProfileAvatar } from "../app-bar/MyProfileAvatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "../ui/dropdown-menu";
import { LogOutButton } from "../app-bar/LogOutButton";
import { DarkModeToggle } from "../theme/DarkModeToggle";
import { useAuth } from "@/app/recoil/hooks/useAuth";
import { useFriends } from "@/app/recoil/hooks/useFriends";
import { useNotifications } from "@/app/recoil/hooks/useNotifications";
import { usePreferences } from "@/app/recoil/hooks/usePreferences";

const items = [
  {
    title: "About",
    url: "/about",
    icon: Info,
    tooltip: "About",
  }
];

const tcgItems = [
  {
    title: "Battle Logs",
    url: "/logs",
    icon: ScrollText,
    tooltip: "TCG Battle Logs",
  },
  {
    title: "Tournaments",
    url: "/tournaments",
    icon: Trophy,
    tooltip: "TCG Tournaments",
  },
  {
    title: "My Decks",
    url: "/decks",
    icon: Atom,
    tooltip: "My Decks",
  },
];

const videoGameItems = [
  {
    title: "Battle Logs",
    url: "/vg/logs",
    icon: ScrollText,
    tooltip: "VGC Battle Logs",
  },
  {
    title: "Tournaments",
    url: "/vg/tournaments",
    icon: Trophy,
    tooltip: "VGC Tournaments",
  },
  {
    title: "My Teams",
    url: "/vg/teams",
    icon: Users,
    tooltip: "My Teams",
  },
];

const pocketItems = [
  {
    title: "Games",
    url: "/pocket",
    icon: WalletMinimal,
    tooltip: "Pocket Game Logs",
  }
];

export function AppSidebarClient() {
  const { user, isAuthenticated, isPremium, isAdmin } = useAuth();
  const { pendingCount: friendRequestCount } = useFriends();
  const { unreadCount: notificationCount } = useNotifications();
  const { state, toggleSidebar } = useSidebar();
  const { preferences, updatePreference } = usePreferences();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {/* Collapse/Expand button when collapsed */}
        {state === 'collapsed' && (
          <div className="flex justify-center mb-2">
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-md hover:bg-sidebar-accent"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
        
        <div className="flex items-center justify-between w-full px-2 py-1">
          <Link href={isAuthenticated ? '/home' : '/'}>
            <Image
              src={'/logo.png'}
              alt='logo'
              width={150}
              height={20}
              className="dark:invert group-data-[collapsible=icon]:hidden"
            />
            <Home className="w-5 h-5 hidden group-data-[collapsible=icon]:block" />
          </Link>

          <div className="flex items-center gap-2">
            {isPremium && state === 'expanded' && <DarkModeToggle />}
            {state === 'expanded' && (
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-md hover:bg-sidebar-accent"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <SidebarSeparator />
        <SidebarMenu>
          {!isAuthenticated && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Log In">
                <Link href='/login'>
                  <LogIn />
                  <span>Log In</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarHeader>
      
      {isAuthenticated && (
        <SidebarContent>
          {preferences.games.tradingCardGame && (
            <>
              <SidebarGroup>
                <SidebarGroupLabel>Pokémon TCG</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {tcgItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild tooltip={item.tooltip}>
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
              
              <SidebarSeparator />
            </>
          )}
          
          {preferences.games.videoGame && (
            <>
              <SidebarGroup>
                <SidebarGroupLabel>Video Game</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {videoGameItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild tooltip={item.tooltip}>
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
              
              <SidebarSeparator />
            </>
          )}
          
          {preferences.games.pocket && (
            <>
              <SidebarGroup>
                <SidebarGroupLabel>Pocket</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {pocketItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild tooltip={item.tooltip}>
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
              
              <SidebarSeparator />
            </>
          )}
          
          {/* Analytics Section */}
          <SidebarGroup>
            <SidebarGroupLabel>Analytics</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Stats">
                    <Link href='/stats'>
                      <BarChart3 />
                      <span>Stats</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          <SidebarSeparator />
          
          {/* Friends & Notifications */}
          <SidebarGroup>
            <SidebarGroupLabel>Social</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Friends">
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
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          {/* Admin section - visible only if user has isAdmin flag in their profile */}
          {isAdmin && (
            <>
              <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Admin">
                      <Link href='/admin'>
                        <BookOpenCheck />
                        <span>Admin</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            </>
          )}
        </SidebarContent>
      )}
      
      <SidebarFooter>
        {isAuthenticated && user && (
          <>
            {/* About Button */}
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.tooltip}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            
            {/* Feedback Button */}
            <SidebarMenu>
              <SidebarMenuItem>
                <ReportBugDialog user={user} />
              </SidebarMenuItem>
            </SidebarMenu>
            
            {/* Notifications Button */}
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton tooltip="Notifications">
                      <Bell />
                      <span>Notifications</span>
                      {notificationCount > 0 && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                          {notificationCount}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="right"
                    align="end"
                    className="w-80"
                  >
                    <div className="p-2">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">Notifications</h3>
                        <Link href="/notifications" className="text-sm text-muted-foreground hover:underline">
                          View all
                        </Link>
                      </div>
                      {notificationCount > 0 ? (
                        <p className="text-sm text-muted-foreground">You have {notificationCount} unread notifications</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">No new notifications</p>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
            
            {/* User Profile */}
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton tooltip={user?.email || 'Profile'} className="group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
                      <div className="shrink-0 group-data-[collapsible=icon]:mx-auto">
                        <MyProfileAvatar user={user} />
                      </div>
                      <span className="truncate group-data-[collapsible=icon]:hidden">{user?.email}</span>
                      <ChevronUp className="ml-auto group-data-[collapsible=icon]:hidden" />
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
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        {preferences.theme === 'light' && <Sun className="w-4 h-4 mr-2" />}
                        {preferences.theme === 'dark' && <Moon className="w-4 h-4 mr-2" />}
                        {/* {preferences.theme === 'system' && <Monitor className="w-4 h-4 mr-2" />} */}
                        Theme
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuRadioGroup value={preferences.theme} onValueChange={(value) => updatePreference('theme', value as 'light' | 'dark')}>
                          <DropdownMenuRadioItem value="light">
                            <Sun className="w-4 h-4 mr-2" />
                            Light
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="dark">
                            <Moon className="w-4 h-4 mr-2" />
                            Dark
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="system">
                            <Monitor className="w-4 h-4 mr-2" />
                            System
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <LogOutButton />
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}