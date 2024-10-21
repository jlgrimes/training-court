import { fetchCurrentUser } from "@/components/auth.utils";
import { AvatarSelector } from "@/components/avatar/AvatarSelector";
import { ScreenNameEditable } from "@/components/screen-name/ScreenNameEditable";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { redirect } from "next/navigation";

export default async function PreferencesPage() {
  const user = await fetchCurrentUser();

  if (!user) {
    redirect('/');
  }

  return (
    <div className="flex flex-col py-6 lg:py-8 pl-8 pr-6 lg:px-16 gap-6 w-full h-full">
      <h1 className="text-xl tracking-wide font-semibold text-slate-800">Preferences</h1>
      <Separator />
      <Tabs defaultValue="account" orientation="vertical" className="flex gap-8 h-full">
        <TabsList className="flex-col w-[200px] h-full gap-2 p-4">
          <TabsTrigger value="account" className="w-full">Account</TabsTrigger>
          <TabsTrigger value="appearance" className="w-full" disabled>Appearance</TabsTrigger>
        </TabsList>
        <TabsContent value="account" className="w-full">
          <div className="flex-col">
            <div className="flex justify-between items-center">
              <Label>Avatar</Label>
              <AvatarSelector userId={user.id} />
            </div>
            <div className="flex justify-between items-center">
              <Label>PTCG Live screen name</Label>
              <ScreenNameEditable userId={user.id} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}