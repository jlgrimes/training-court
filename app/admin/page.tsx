import { redirect } from "next/navigation";
import { fetchCurrentUser } from "@/components/auth.utils";
import { isUserAnAdmin } from "@/components/admin/admin.utils";
import { fetchCommonlyUsedAvatars } from "@/components/admin/admin.server.utils";
import { Label } from "@/components/ui/label";
import { fetchAvatarImages } from "@/components/avatar/avatar.server.utils";
import { getMainSelectableAvatars } from "@/components/avatar/avatar.utils";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function AdminPage() {
  const user = await fetchCurrentUser();

  if (!user || !isUserAnAdmin(user)) {
    return redirect("/");
  }

  const allAvatarImages = fetchAvatarImages();
  const mostCommonlyUsedAvatars = await fetchCommonlyUsedAvatars();

  const unusedAvatars = getMainSelectableAvatars(allAvatarImages).filter((availableAvatar) => !mostCommonlyUsedAvatars?.some(({ avatar }) => avatar === availableAvatar));

  return (
    <div className="flex flex-col py-4 lg:py-8 px-8 lg:px-16 gap-4 w-full h-full">
      <CardTitle>Welcome admin!</CardTitle>

      <Tabs defaultValue="feedback">
        <TabsList>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="avatars">Avatars</TabsTrigger>
        </TabsList>
        <TabsContent value="avatars">
          <>
          <Label>Most commonly used avatars:</Label>
             <div className="grid grid-cols-12 gap-2">
              {mostCommonlyUsedAvatars?.map(({ avatar, avatar_count }) => (
                <div key={`${avatar}-count`} className="flex flex-col items-center">
                  <img className="pixel-image" src={avatar} />
                  <Label>{avatar_count}</Label>
                </div>
              ))}
            </div>
            <Label>Unused avatars:</Label>
            {(unusedAvatars.length === 0) && <CardDescription>All avatars are being used!</CardDescription>}
            {unusedAvatars.map((avatar) => <img className="pixel-image" src={avatar} />)}
          </>
        </TabsContent>
        <TabsContent value="feedback">
          WIP
        </TabsContent>
      </Tabs>
    </div>
  );
}
