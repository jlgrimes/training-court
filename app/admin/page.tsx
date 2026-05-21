import { redirect } from "next/navigation";
import { fetchCurrentUser } from "@/components/auth.utils";
import { isUserAnAdmin } from "@/components/admin/admin.utils";
import { countAllUsers, countUsersInLastXDays, fetchAllFeedback, fetchCommonlyUsedAvatars, calculatePercentageChange, countAllLogs } from "@/components/admin/admin.server.utils";
import { Label } from "@/components/ui/label";
import { fetchAvatarImages } from "@/components/avatar/avatar.server.utils";
import { getMainSelectableAvatars } from "@/components/avatar/avatar.utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge";
import { FeedbackCard } from "@/components/admin/FeedbackCard";
import { Activity, NotebookPen } from "lucide-react";
import { Users } from "lucide-react";
import { TranslatedText } from "@/components/general-translation/TranslatedText";

export default async function AdminPage() {
  const user = await fetchCurrentUser();

  if (!user || !isUserAnAdmin(user.id)) {
    return redirect("/");
  }

  const allAvatarImages = fetchAvatarImages();
  const mostCommonlyUsedAvatars = await fetchCommonlyUsedAvatars();
  const allFeedback = await fetchAllFeedback();

  const unusedAvatars = getMainSelectableAvatars(allAvatarImages, '').filter(
    (availableAvatar) => !mostCommonlyUsedAvatars?.some((entry: { avatar: string }) => entry.avatar === availableAvatar)
  );
  const totalUsers = await countAllUsers();
  const totalLogs = await countAllLogs();
  const lastSevenDaysUsers = await countUsersInLastXDays(0, 7) ?? 0;
  const previousSevenDaysUsers = await countUsersInLastXDays(7, 14) ?? 0;

  const percentageChange = calculatePercentageChange(lastSevenDaysUsers, previousSevenDaysUsers);

  return (
    <div className="flex flex-col py-4 lg:py-8 px-4 sm:px-6 lg:px-16 gap-4 w-full h-full max-w-full">
      <CardTitle><TranslatedText id="admin.welcome">Welcome admin!</TranslatedText></CardTitle>

      <Tabs defaultValue="feedback" className="w-full max-w-full">
        <TabsList>
          <TabsTrigger value="feedback"><TranslatedText id="admin.tabs.feedback">Feedback</TranslatedText></TabsTrigger>
          <TabsTrigger value="avatars"><TranslatedText id="admin.tabs.avatars">Avatars</TranslatedText></TabsTrigger>
          <TabsTrigger value="users"><TranslatedText id="admin.tabs.users">Users</TranslatedText></TabsTrigger>
        </TabsList>
        <TabsContent value="avatars">
          <>
          <Label><TranslatedText id="admin.avatars.mostUsed">Most commonly used avatars:</TranslatedText></Label>
             <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 gap-2">
              {mostCommonlyUsedAvatars?.map(({ avatar, avatar_count }) => (
                <div
                  key={`${avatar}-count`}
                  className="flex flex-col items-center"
                >
                  <img
                    className="pixel-image w-10 h-10 sm:w-12 sm:h-12"
                    src={avatar}
                    alt=""
                  />
                  <Label className="text-xs sm:text-sm">{avatar_count}</Label>
                </div>
              ))}
            </div>
            <Label><TranslatedText id="admin.avatars.unused">Unused avatars:</TranslatedText></Label>
            {(unusedAvatars.length === 0) && <CardDescription><TranslatedText id="admin.avatars.allUsed">All avatars are being used!</TranslatedText></CardDescription>}
            {unusedAvatars.map((avatar, index) => <img key={index} className="pixel-image" src={avatar} />)}
            
          </>
        </TabsContent>

        <TabsContent value="feedback" className="w-full max-w-full">
          <Tabs defaultValue="unresolved" className="w-full max-w-full">
            <TabsList className="w-full flex flex-wrap gap-2">
              <TabsTrigger value="unresolved" className="flex-1 sm:flex-none">
                <TranslatedText id="admin.feedback.unresolved">Unresolved</TranslatedText>
              </TabsTrigger>
              <TabsTrigger value="resolved" className="flex-1 sm:flex-none">
                <TranslatedText id="admin.feedback.resolved">Resolved</TranslatedText>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="unresolved" className="w-full max-w-full">
              <div className="space-y-2 w-full max-w-full">
                <Label>
                  {allFeedback?.filter(({ is_fixed }) => !is_fixed).length} pieces of
                  <TranslatedText id="admin.feedback.unresolvedSuffix">pieces of unresolved feedback. Get to work!</TranslatedText>
                </Label>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {allFeedback
                    ?.filter(({ is_fixed }) => !is_fixed)
                    .map((feedback) => (
                      <FeedbackCard key={feedback.id} feedback={feedback} />
                    ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="resolved" className="w-full max-w-full">
              <div className="space-y-2 w-full max-w-full">
                <Label>
                  <TranslatedText id="admin.feedback.fixedPrefix">You have fixed</TranslatedText>{" "}
                  {allFeedback?.filter(({ is_fixed }) => is_fixed).length} customer
                  <TranslatedText id="admin.feedback.fixedSuffix">customer feedbacks. Good job!</TranslatedText>
                </Label>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {allFeedback
                    ?.filter(({ is_fixed }) => is_fixed)
                    .map((feedback) => (
                      <FeedbackCard key={feedback.id} feedback={feedback} />
                    ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>


        <TabsContent value="users">
          <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Card x-chunk="dashboard-01-chunk-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <TranslatedText id="admin.users.totalUsers">Total Users</TranslatedText>
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              {/* <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p> */}
            </CardContent>
          </Card>

          <Card x-chunk="dashboard-01-chunk-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                  <TranslatedText id="admin.users.joinedLastWeek">Users Joined in Last Week</TranslatedText>
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lastSevenDaysUsers}</div>
                <p className="text-xs text-muted-foreground">
                    {previousSevenDaysUsers > 0 ? (
                      `${percentageChange.toFixed(2)}% change from the week before`
                    ) : (
                      'N/A'
                    )}
                  </p>
              </CardContent>
            </Card>

            <Card x-chunk="dashboard-01-chunk-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <TranslatedText id="admin.users.totalLoggedGames">Total Logged Games</TranslatedText>
                </CardTitle>
                <NotebookPen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLogs}</div>
                {/* <p className="text-xs text-muted-foreground">
                  +20.1% from last month
                </p> */}
              </CardContent>
            </Card>

          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
