import { fetchCurrentUser } from '@/components/auth.utils';
import { fetchAvatarImages } from '@/components/avatar/avatar.server.utils';
import { AvatarSelector } from '@/components/avatar/AvatarSelector';
import { ScreenNameEditable } from '@/components/screen-name/ScreenNameEditable';
import { Header } from '@/components/ui/header';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchUserData } from '@/components/user-data.utils';
import { GamePreferences } from '@/components/preferences/GamePreferences';
import { normalizePreferredGames } from '@/lib/game-preferences';
import { redirect } from 'next/navigation';

export default async function PreferencesPage() {
  const user = await fetchCurrentUser();
  const avatars = fetchAvatarImages();
  const userData = user ? await fetchUserData(user.id) : null;

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
          <TabsTrigger value='appearance' className='w-full'>
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
        <TabsContent value='appearance' className='w-full'>
          <div className='flex flex-col gap-6'>
            <GamePreferences
              userId={user.id}
              initialPreferredGames={normalizePreferredGames(userData?.preferred_games)}
            />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
