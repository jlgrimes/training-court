import { redirect } from "next/navigation";
import { fetchCurrentUser } from "@/components/auth.utils";
import { isUserAnAdmin } from "@/components/admin/admin.utils";
import { fetchAllFeedback, fetchCommonlyUsedAvatars } from "@/components/admin/admin.server.utils";
import { Label } from "@/components/ui/label";
import { fetchAvatarImages } from "@/components/avatar/avatar.server.utils";
import { getMainSelectableAvatars } from "@/components/avatar/avatar.utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDistanceToNowStrict } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge";

export default async function AdminPage() {
  const user = await fetchCurrentUser();

  if (!user || !isUserAnAdmin(user)) {
    return redirect("/");
  }

  const allAvatarImages = fetchAvatarImages();
  const mostCommonlyUsedAvatars = await fetchCommonlyUsedAvatars();
  const allFeedback = await fetchAllFeedback();

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
        <Tabs defaultValue="unresolved">
          <TabsList>
            <TabsTrigger value="unresolved">Unresolved</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
          <TabsContent value="unresolved">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-2">
              {allFeedback?.filter(({ is_fixed }) => !is_fixed).map((feedback) => (
                <Card>
                  <CardHeader>
                    <CardTitle>{`${feedback.feature_name} > ${feedback.bug_type}`}                     {feedback.is_fixed && <Badge variant='secondary' className="bg-green-200 ml-1">Resolved</Badge>}</CardTitle>
                    <CardDescription>{formatDistanceToNowStrict(feedback.created_at, { addSuffix: true })}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <>
                      <p>{feedback.description}</p>
                      {feedback.dev_notes && <CardDescription className="mt-2">Dev notes: {feedback.dev_notes}</CardDescription>}
                    </>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
          </TabsContent>
          <TabsContent value="resolved">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-2">
              {allFeedback?.filter(({ is_fixed }) => is_fixed).map((feedback) => (
                <Card>
                  <CardHeader>
                    <CardTitle>{`${feedback.feature_name} > ${feedback.bug_type}`}                     {feedback.is_fixed && <Badge variant='secondary' className="bg-green-200 ml-1">Resolved</Badge>}</CardTitle>
                    <CardDescription>{formatDistanceToNowStrict(feedback.created_at, { addSuffix: true })}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <>
                      <p>{feedback.description}</p>
                      {feedback.dev_notes && <CardDescription className="mt-2">Dev notes: {feedback.dev_notes}</CardDescription>}
                    </>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
          </TabsContent>
        </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
