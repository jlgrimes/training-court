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
} from "@/components/ui/sidebar"

import { Atom, ChevronUp, Hammer, Info, LogIn, ScrollText, Trophy, WalletMinimal, ChartBarDecreasing  } from "lucide-react"
import Image from "next/image"
import { useRecoilValue } from "recoil";
import { userAtom } from "@/app/recoil/atoms/user";
import { usePreferredGames } from "@/hooks/useGameGuard";
import { ReportBugDialog } from "../app-bar/ReportBugDialog";
import Link from "next/link";
import { MyProfileAvatar } from "../app-bar/MyProfileAvatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { LogOutButton } from "../app-bar/LogOutButton";
import { isUserAnAdmin } from "../admin/admin.utils";
import { DarkModeToggle } from "../theme/DarkModeToggle";
import { isPremiumUser } from "../premium/premium.utils";
import { TranslatedText } from "@/components/general-translation/TranslatedText";
 
const items = [
  {
    id: "about",
    title: "About",
    url: "/about",
    icon: Info,
  }
]

const tcgItems = [
  {
    id: "battleLogs",
    title: "Battle Logs",
    url: "/ptcg/logs",
    icon: ScrollText,
  },
  {
    id: "tournaments",
    title: "Tournaments",
    url: "/ptcg/tournaments",
    icon: Trophy,
  },
  {
    id: "stats",
    title: "Stats",
    url: "/ptcg/stats",
    icon: ChartBarDecreasing,
  },
  {
    id: "deckbuilder",
    title: "Deckbuilder",
    url: "/ptcg/deckbuilder",
    icon: Hammer,
  },
]

const pocketItems = [
  {
    id: "games",
    title: "Games",
    url: "/pocket",
    icon: WalletMinimal,
  },
  {
    id: "tournaments",
    title: "Tournaments",
    url: "/pocket/tournaments",
    icon: Trophy,
  }
]

function SidebarItemLabel({ id }: { id: string }) {
  switch (id) {
    case "about":
      return <TranslatedText id="sidebar.about">About</TranslatedText>;
    case "battleLogs":
      return <TranslatedText id="sidebar.tcg.battleLogs">Battle Logs</TranslatedText>;
    case "tournaments":
      return <TranslatedText id="sidebar.tournaments">Tournaments</TranslatedText>;
    case "stats":
      return <TranslatedText id="sidebar.tcg.stats">Stats</TranslatedText>;
    case "deckbuilder":
      return <TranslatedText id="sidebar.tcg.deckbuilder">Deckbuilder</TranslatedText>;
    case "games":
      return <TranslatedText id="sidebar.pocket.games">Games</TranslatedText>;
    default:
      return null;
  }
}

export function AppSidebar() {
  const user = useRecoilValue(userAtom);
  const { preferredGames } = usePreferredGames();
  const showTcg = !!user && preferredGames.includes('pokemon-tcg');
  const showPocket = !!user && preferredGames.includes('pokemon-pocket');

  return (
  <Sidebar>
    <SidebarHeader>
      <div className="flex items-center justify-between w-full px-2 py-1">
        <Link href="/home">
          <Image
            src={'/logo.png'}
            alt='logo'
            width={150}
            height={20}
            className="dark:invert"
          />
        </Link>

        <DarkModeToggle />
      </div>
      <SidebarSeparator />
      <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>
                        <SidebarItemLabel id={item.id} />
                      </span>
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
                    <span><TranslatedText id="sidebar.logIn">Log In</TranslatedText></span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
            </SidebarMenu>
      </SidebarHeader>
      {user && (
        <SidebarContent>
          {showTcg && (
            <SidebarGroup>
              <SidebarGroupLabel>Pokémon TCG</SidebarGroupLabel>
              <SidebarGroupContent>
              <SidebarMenu>
              {tcgItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon />
                        <span>
                          <SidebarItemLabel id={item.id} />
                        </span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
          {showPocket && (
            <SidebarGroup>
              <SidebarGroupLabel>Pokémon Pocket</SidebarGroupLabel>
              <SidebarGroupContent>
              <SidebarMenu>
              {pocketItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon />
                        <span>
                          <SidebarItemLabel id={item.id} />
                        </span>
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
            <SidebarGroupLabel><TranslatedText id="sidebar.admin">Admin</TranslatedText></SidebarGroupLabel>
            <SidebarGroupContent>
            <SidebarMenu>
            <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href='/admin'>
                      <Atom />
                      <span><TranslatedText id="sidebar.adminStuff">admin stuff</TranslatedText></span>
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
                      <TranslatedText id="sidebar.preferences">Preferences</TranslatedText>
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
