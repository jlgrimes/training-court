import { User } from "@supabase/supabase-js"
import { LogInOut } from "./LogInOut";
import { MyProfileAvatar } from "./MyProfileAvatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { AvatarSelector } from "../avatar/AvatarSelector";
import { ScreenNameEditable } from "../screen-name/ScreenNameEditable";
import Link from "next/link";
import { LogOutButton } from "./LogOutButton";
import { isUserAnAdmin } from "../admin/admin.utils";

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
              <Link href="/admin" className="font-semibold">
                Admin panel 
              </Link>
            </DropdownMenuItem>
          )}
        <DropdownMenuSeparator />
        <LogOutButton />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}