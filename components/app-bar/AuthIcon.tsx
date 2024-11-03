import { User } from "@supabase/supabase-js"
import { LogInOut } from "./LogInOut";
import { MyProfileAvatar } from "./MyProfileAvatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from "../ui/dropdown-menu";
import Link from "next/link";
import { LogOutButton } from "./LogOutButton";
import { isUserAnAdmin } from "../admin/admin.utils";
import { Sprite } from "../archetype/sprites/Sprite";

interface AuthIconProps {
  user: User | null;
}

export const AuthIcon = (props: AuthIconProps) => {
  if (!props.user) {
    return <LogInOut />
  }

  return(
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="cursor-pointer">
          <MyProfileAvatar user={props.user} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
        <Link href='/preferences'>
          Preferences
        </Link>
          </DropdownMenuItem>
          {props.user && isUserAnAdmin(props.user.id) && (
            <DropdownMenuItem asChild>
              <Link href="/admin">
                Admin panel
                <DropdownMenuShortcut><Sprite small name='porygon-z'/></DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
          )}
        <DropdownMenuSeparator />
        <LogOutButton />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}