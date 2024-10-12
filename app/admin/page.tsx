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

export default async function AdminPage() {
  const user = await fetchCurrentUser();

  if (!user || !isUserAnAdmin(user.id)) {
    return redirect("/");
  }

  const allAvatarImages = fetchAvatarImages();
  const mostCommonlyUsedAvatars = await fetchCommonlyUsedAvatars();
  const allFeedback = await fetchAllFeedback();

  const unusedAvatars = getMainSelectableAvatars(allAvatarImages, '').filter((availableAvatar) => !mostCommonlyUsedAvatars?.some(({ avatar }) => avatar === availableAvatar));
  const totalUsers = await countAllUsers();
  const totalLogs = await countAllLogs();
  const lastSevenDaysUsers = await countUsersInLastXDays(0, 7) ?? 0;
  const previousSevenDaysUsers = await countUsersInLastXDays(7, 14) ?? 0;

  const percentageChange = calculatePercentageChange(lastSevenDaysUsers, previousSevenDaysUsers);

  return (
    <div className="flex flex-col py-4 lg:py-8 px-8 lg:px-16 gap-4 w-full h-full">
      <CardTitle>Welcome admin!</CardTitle>

      <Tabs defaultValue="feedback">
        <TabsList>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="avatars">Avatars</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
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
            {unusedAvatars.map((avatar, index) => <img key={index} className="pixel-image" src={avatar} />)}
            
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
              <Label>{allFeedback?.filter(({ is_fixed }) => !is_fixed).length} pieces of unresolved feedback. Get to work!</Label>
              {allFeedback?.filter(({ is_fixed }) => !is_fixed).map((feedback) => (
                <FeedbackCard feedback={feedback} />
              ))}
            </div>
          </ScrollArea>
          </TabsContent>
          <TabsContent value="resolved">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-2">
              <Label>You have fixed {allFeedback?.filter(({ is_fixed }) => is_fixed).length} customer feedbacks. Good job!</Label>
              {allFeedback?.filter(({ is_fixed }) => is_fixed).map((feedback) => (
                <FeedbackCard feedback={feedback} />
              ))}
            </div>
          </ScrollArea>
          </TabsContent>
        </Tabs>
        </TabsContent>
        <TabsContent value="users">

        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card x-chunk="dashboard-01-chunk-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Users
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
              Users Joined in Last Week
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
                Total Logged Games
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
