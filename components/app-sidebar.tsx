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

import { Calendar, Home, Inbox, Info, ScrollText, Search, Settings, Trophy, WalletMinimal } from "lucide-react"
import Image from "next/image"
import { fetchCurrentUser } from "./auth.utils";
import { ReportBugDialog } from "./app-bar/ReportBugDialog";
import Link from "next/link";
import { Badge } from "./ui/badge";
 
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
    </Sidebar>
  )
}
