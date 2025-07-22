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
} from "@/components/ui/sidebar"

import { Atom, BriefcaseBusiness, Calendar, ChevronUp, Home, Inbox, Info, LogIn, ScrollText, Search, Settings, ToggleLeft, ToggleRight, Trophy, WalletMinimal } from "lucide-react"
import Image from "next/image"
import { fetchCurrentUser } from "./auth.utils";
import { ReportBugDialog } from "./app-bar/ReportBugDialog";
import Link from "next/link";
import { MyProfileAvatar } from "./app-bar/MyProfileAvatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { LogOutButton } from "./app-bar/LogOutButton";
import { isUserAnAdmin } from "./admin/admin.utils";
import { DarkModeToggle } from "./theme/DarkModeToggle";
import { isPremiumUser } from "./premium/premium.utils";
import { createClient } from "@/utils/supabase/server";
 
const items = [
  {
    title: "About",
    url: "/about",
    icon: Info,
  }
]

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
]

const videoItems = [
  {
    title: "Video Game",
    url: "/video-game",
    icon: BriefcaseBusiness,
  }
]

const pocketItems = [
  {
    title: "Games",
    url: "/pocket",
    icon: WalletMinimal,
  }
]

async function getUserProfile(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('profiles')
    .select('selected_games')
    .eq('id', userId)
    .single();
  
  return data;
}

export async function AppSidebar() {
  const user = await fetchCurrentUser();
  const profile = user ? await getUserProfile(user.id) : null;
  const selectedGames = profile?.selected_games || ['tcg', 'video', 'pocket'];

  return (
  <Sidebar>
    <SidebarHeader>
      <div className="flex items-center justify-between w-full px-2 py-1">
        <Link href={user ? '/home' : '/'}>
          <Image
            src={'/logo.png'}
            alt='logo'
            width={150}
            height={20}
            className="dark:invert"
          />
        </Link>

        {isPremiumUser(user?.id) && <DarkModeToggle />}
      </div>
      <SidebarSeparator />
      <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            {user && (
              <SidebarMenuItem>
                <ReportBugDialog user={user} />
              </SidebarMenuItem>
            )}
                      {!user && (
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href='/login'>
                    <LogIn />
                    <span>Log In</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
            </SidebarMenu>
      </SidebarHeader>
      {user && (
        <SidebarContent>
          {selectedGames.includes('tcg') && (
            <SidebarGroup>
              <SidebarGroupLabel>Trading Card Game</SidebarGroupLabel>
              <SidebarGroupContent>
              <SidebarMenu>
              {tcgItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
          {selectedGames.includes('video') && (
            <SidebarGroup>
              <SidebarGroupLabel>Video Game</SidebarGroupLabel>
              <SidebarGroupContent>
              <SidebarMenu>
              {videoItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
          {selectedGames.includes('pocket') && (
            <SidebarGroup>
              <SidebarGroupLabel>Pocket</SidebarGroupLabel>
              <SidebarGroupContent>
              <SidebarMenu>
              {pocketItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
          {isUserAnAdmin(user.id) && (
            <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
            <SidebarMenu>
            <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href='/admin'>
                      <Atom />
                      <span>admin stuff</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          )}
        </SidebarContent>
      )}
        <SidebarFooter>
          {user && (
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
                    <a href='/preferences'>
                      Preferences
                    </a>
                  </DropdownMenuItem>
                  <LogOutButton />
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
          )}
        </SidebarFooter>
    </Sidebar>
  )
}