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

import { Calendar, ChevronUp, Home, Inbox, Info, LogIn, ScrollText, Search, Settings, ToggleLeft, ToggleRight, Trophy, WalletMinimal } from "lucide-react"
import Image from "next/image"
import { fetchCurrentUser } from "./auth.utils";
import { ReportBugDialog } from "./app-bar/ReportBugDialog";
import Link from "next/link";
import { MyProfileAvatar } from "./app-bar/MyProfileAvatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { LogOutButton } from "./app-bar/LogOutButton";
 
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

const pocketItems = [
  {
    title: "Games",
    url: "/pocket",
    icon: WalletMinimal,
  }
]

export async function AppSidebar() {
  const user = await fetchCurrentUser();

  return (
  <Sidebar>
    <SidebarHeader>
      <Link href={user ? '/home' : '/'} className="pt-1 pl-1">
        <Image src={'/logo.png'} alt='logo' width={150} height={20} />
      </Link>
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
