import { fetchCurrentUser } from '@/components/auth.utils';
import { fetchAvatarImages } from '@/components/avatar/avatar.server.utils';
import { AvatarSelector } from '@/components/avatar/AvatarSelector';
import { ScreenNameEditable } from '@/components/screen-name/ScreenNameEditable';
import { buttonVariants } from '@/components/ui/button';
import { Header } from '@/components/ui/header';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { redirect } from 'next/navigation';

export default async function PreferencesPage() {
  const user = await fetchCurrentUser();
  const avatars = fetchAvatarImages();

  if (!user) {
    redirect('/');
  }

  return (
    <>
      <Header>Preferences</Header>
      <Tabs
        defaultValue='account'
        orientation='vertical'
        className='flex flex-col md:flex-row gap-4 md:gap-8 h-full'
      >
        <TabsList className='md:flex-col w-full md:w-[200px] h-full gap-2 md:p-2'>
          <TabsTrigger value='account' className='w-full'>
            Account
          </TabsTrigger>
          <TabsTrigger value='appearance' className='w-full' disabled>
            Appearance
          </TabsTrigger>
        </TabsList>
        <TabsContent value='account' className='w-full'>
          <div className='flex-col'>
            <div className='flex justify-between items-center'>
              <Label>Avatar</Label>
              <AvatarSelector userId={user.id} avatarImages={avatars} />
            </div>
            <div className='flex justify-between items-center'>
              <Label>PTCG Live screen name</Label>
              <ScreenNameEditable userId={user.id} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
