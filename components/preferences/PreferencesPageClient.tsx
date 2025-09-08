'use client';

import { AvatarSelector } from '@/components/avatar/AvatarSelector';
import { ScreenNameEditable } from '@/components/screen-name/ScreenNameEditable';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/ui/header';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/app/recoil/hooks/useAuth';
import { usePreferences } from '@/app/recoil/hooks/usePreferences';
import { useUI } from '@/app/recoil/hooks/useUI';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GameSelector } from '@/components/ui/game-selector';

interface PreferencesPageClientProps {
  avatarImages: any[];
}

export function PreferencesPageClient({ avatarImages }: PreferencesPageClientProps) {
  const { user, isAuthenticated } = useAuth();
  const { preferences, updatePreference, updateNestedPreference, resetPreferences } = usePreferences();
  const { showSuccessToast, showErrorToast } = useUI();

  if (!isAuthenticated || !user) {
    return <div>Please log in to view preferences.</div>;
  }

  const handleThemeChange = (value: 'light' | 'dark') => {
    updatePreference('theme', value);
    showSuccessToast('Theme preference updated');
  };

  const handleNotificationToggle = (type: 'email' | 'push' | 'inApp', checked: boolean) => {
    updateNestedPreference('notifications', type, checked);
    showSuccessToast(`${type} notifications ${checked ? 'enabled' : 'disabled'}`);
  };

  const handlePrivacyToggle = (type: 'profileVisibility' | 'showStats' | 'showBattleLogs', value: any) => {
    updateNestedPreference('privacy', type, value);
    showSuccessToast('Privacy settings updated');
  };

  const handleGameplayToggle = (type: 'autoImportLogs' | 'confirmBeforeDelete', checked: boolean) => {
    updateNestedPreference('gameplay', type, checked);
    showSuccessToast('Gameplay settings updated');
  };

  const handleDisplayToggle = (type: 'compactView' | 'showAvatars' | 'animationsEnabled', checked: boolean) => {
    updateNestedPreference('display', type, checked);
    showSuccessToast('Display settings updated');
  };

  const handleGameToggle = (game: 'tradingCardGame' | 'videoGame' | 'pocket', checked: boolean) => {
    // Count how many games are currently enabled
    const enabledGames = Object.values(preferences.games).filter(Boolean).length;
    
    // Prevent disabling the last game
    if (!checked && enabledGames === 1) {
      showErrorToast('You must have at least one game enabled');
      return;
    }
    
    updateNestedPreference('games', game, checked);
    showSuccessToast(`${game === 'tradingCardGame' ? 'Trading Card Game' : game === 'videoGame' ? 'Video Game' : 'Pocket'} ${checked ? 'enabled' : 'disabled'}`);
  };

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
          <TabsTrigger value='notifications' className='w-full'>
            Notifications
          </TabsTrigger>
          <TabsTrigger value='privacy' className='w-full'>
            Privacy
          </TabsTrigger>
          <TabsTrigger value='gameplay' className='w-full'>
            Gameplay
          </TabsTrigger>
          <TabsTrigger value='games' className='w-full'>
            Games
          </TabsTrigger>
        </TabsList>

        <TabsContent value='account' className='w-full'>
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex justify-between items-center'>
                <Label>Avatar</Label>
                <AvatarSelector userId={user.id} avatarImages={avatarImages} />
              </div>
              <Separator />
              <div className='flex justify-between items-center'>
                <Label>PTCG Live screen name</Label>
                <ScreenNameEditable userId={user.id} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='appearance' className='w-full'>
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize how the app looks</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex justify-between items-center'>
                <Label>Theme</Label>
                <Select value={preferences.theme} onValueChange={handleThemeChange}>
                  <SelectTrigger className='w-[180px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='light'>Light</SelectItem>
                    <SelectItem value='dark'>Dark</SelectItem>
                    <SelectItem value='system'>System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className='flex justify-between items-center'>
                <Label>Date Format</Label>
                <Select value={preferences.dateFormat} onValueChange={(value) => updatePreference('dateFormat', value)}>
                  <SelectTrigger className='w-[180px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='MM/DD/YYYY'>MM/DD/YYYY</SelectItem>
                    <SelectItem value='DD/MM/YYYY'>DD/MM/YYYY</SelectItem>
                    <SelectItem value='YYYY-MM-DD'>YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className='space-y-2'>
                <h3 className='font-medium'>Display Options</h3>
                <div className='flex justify-between items-center'>
                  <Label>Compact View</Label>
                  <Switch
                    checked={preferences.display.compactView}
                    onCheckedChange={(checked) => handleDisplayToggle('compactView', checked)}
                  />
                </div>
                <div className='flex justify-between items-center'>
                  <Label>Show Avatars</Label>
                  <Switch
                    checked={preferences.display.showAvatars}
                    onCheckedChange={(checked) => handleDisplayToggle('showAvatars', checked)}
                  />
                </div>
                <div className='flex justify-between items-center'>
                  <Label>Enable Animations</Label>
                  <Switch
                    checked={preferences.display.animationsEnabled}
                    onCheckedChange={(checked) => handleDisplayToggle('animationsEnabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='notifications' className='w-full'>
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Control how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex justify-between items-center'>
                <Label>Email Notifications</Label>
                <Switch
                  checked={preferences.notifications.email}
                  onCheckedChange={(checked) => handleNotificationToggle('email', checked)}
                />
              </div>
              <div className='flex justify-between items-center'>
                <Label>Push Notifications</Label>
                <Switch
                  checked={preferences.notifications.push}
                  onCheckedChange={(checked) => handleNotificationToggle('push', checked)}
                />
              </div>
              <div className='flex justify-between items-center'>
                <Label>In-App Notifications</Label>
                <Switch
                  checked={preferences.notifications.inApp}
                  onCheckedChange={(checked) => handleNotificationToggle('inApp', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='privacy' className='w-full'>
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control your privacy and visibility</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex justify-between items-center'>
                <Label>Profile Visibility</Label>
                <Select 
                  value={preferences.privacy.profileVisibility} 
                  onValueChange={(value) => handlePrivacyToggle('profileVisibility', value)}
                >
                  <SelectTrigger className='w-[180px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='public'>Public</SelectItem>
                    <SelectItem value='friends'>Friends Only</SelectItem>
                    <SelectItem value='private'>Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='flex justify-between items-center'>
                <Label>Show Stats</Label>
                <Switch
                  checked={preferences.privacy.showStats}
                  onCheckedChange={(checked) => handlePrivacyToggle('showStats', checked)}
                />
              </div>
              <div className='flex justify-between items-center'>
                <Label>Show Battle Logs</Label>
                <Switch
                  checked={preferences.privacy.showBattleLogs}
                  onCheckedChange={(checked) => handlePrivacyToggle('showBattleLogs', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='gameplay' className='w-full'>
          <Card>
            <CardHeader>
              <CardTitle>Gameplay Settings</CardTitle>
              <CardDescription>Customize your gameplay experience</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex justify-between items-center'>
                <Label>Default Format</Label>
                <Select 
                  value={preferences.gameplay.defaultFormat} 
                  onValueChange={(value) => updateNestedPreference('gameplay', 'defaultFormat', value)}
                >
                  <SelectTrigger className='w-[180px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Standard'>Standard</SelectItem>
                    <SelectItem value='Expanded'>Expanded</SelectItem>
                    <SelectItem value='GLC'>GLC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='flex justify-between items-center'>
                <Label>Auto Import Logs</Label>
                <Switch
                  checked={preferences.gameplay.autoImportLogs}
                  onCheckedChange={(checked) => handleGameplayToggle('autoImportLogs', checked)}
                />
              </div>
              <div className='flex justify-between items-center'>
                <Label>Confirm Before Delete</Label>
                <Switch
                  checked={preferences.gameplay.confirmBeforeDelete}
                  onCheckedChange={(checked) => handleGameplayToggle('confirmBeforeDelete', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='games' className='w-full'>
          <Card>
            <CardHeader>
              <CardTitle>Game Settings</CardTitle>
              <CardDescription>Choose which games to show in the sidebar</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex justify-between items-center'>
                <div>
                  <Label>Trading Card Game</Label>
                  <p className='text-sm text-muted-foreground'>Show TCG section in sidebar</p>
                </div>
                <Switch
                  checked={preferences.games.tradingCardGame}
                  onCheckedChange={(checked) => handleGameToggle('tradingCardGame', checked)}
                />
              </div>
              <Separator />
              <div className='flex justify-between items-center'>
                <div>
                  <Label>Video Game</Label>
                  <p className='text-sm text-muted-foreground'>Show VGC section in sidebar</p>
                </div>
                <Switch
                  checked={preferences.games.videoGame}
                  onCheckedChange={(checked) => handleGameToggle('videoGame', checked)}
                />
              </div>
              <Separator />
              <div className='flex justify-between items-center'>
                <div>
                  <Label>Pocket</Label>
                  <p className='text-sm text-muted-foreground'>Show Pocket section in sidebar</p>
                </div>
                <Switch
                  checked={preferences.games.pocket}
                  onCheckedChange={(checked) => handleGameToggle('pocket', checked)}
                />
              </div>
              <div className='mt-4 p-4 bg-muted rounded-lg'>
                <p className='text-sm text-muted-foreground'>
                  Note: You must have at least one game enabled to use Training Court.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className='mt-8 flex justify-end'>
        <Button
          variant='outline'
          onClick={() => {
            resetPreferences();
            showSuccessToast('Preferences reset to defaults');
          }}
        >
          Reset to Defaults
        </Button>
      </div>
    </>
  );
}