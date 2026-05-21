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
import { T, useGT } from 'gt-react';

interface PreferencesPageClientProps {
  avatarImages: any[];
}

export function PreferencesPageClient({ avatarImages }: PreferencesPageClientProps) {
  const { user, isAuthenticated } = useAuth();
  const { preferences, updatePreference, updateNestedPreference, resetPreferences } = usePreferences();
  const { showSuccessToast, showErrorToast } = useUI();
  const gt = useGT();

  if (!isAuthenticated || !user) {
    return <div><T id="preferences.loginRequired">Please log in to view preferences.</T></div>;
  }

  const handleThemeChange = (value: 'light' | 'dark') => {
    updatePreference('theme', value);
    showSuccessToast(gt('Theme preference updated', { $id: 'preferences.toast.themeUpdated' }));
  };

  const handleNotificationToggle = (type: 'email' | 'push' | 'inApp', checked: boolean) => {
    updateNestedPreference('notifications', type, checked);
    showSuccessToast(gt('{type} notifications {status}', {
      $id: 'preferences.toast.notificationsUpdated',
      type,
      status: checked ? 'enabled' : 'disabled',
    }));
  };

  const handlePrivacyToggle = (type: 'profileVisibility' | 'showStats' | 'showBattleLogs', value: any) => {
    updateNestedPreference('privacy', type, value);
    showSuccessToast(gt('Privacy settings updated', { $id: 'preferences.toast.privacyUpdated' }));
  };

  const handleGameplayToggle = (type: 'autoImportLogs' | 'confirmBeforeDelete', checked: boolean) => {
    updateNestedPreference('gameplay', type, checked);
    showSuccessToast(gt('Gameplay settings updated', { $id: 'preferences.toast.gameplayUpdated' }));
  };

  const handleDisplayToggle = (type: 'compactView' | 'showAvatars' | 'animationsEnabled', checked: boolean) => {
    updateNestedPreference('display', type, checked);
    showSuccessToast(gt('Display settings updated', { $id: 'preferences.toast.displayUpdated' }));
  };

  const handleGameToggle = (game: 'tradingCardGame' | 'videoGame' | 'pocket', checked: boolean) => {
    // Count how many games are currently enabled
    const enabledGames = Object.values(preferences.games).filter(Boolean).length;
    
    // Prevent disabling the last game
    if (!checked && enabledGames === 1) {
      showErrorToast(gt('You must have at least one game enabled', { $id: 'preferences.toast.oneGameRequired' }));
      return;
    }
    
    updateNestedPreference('games', game, checked);
    showSuccessToast(gt('{gameName} {status}', {
      $id: 'preferences.toast.gameUpdated',
      gameName: game === 'tradingCardGame' ? 'Trading Card Game' : game === 'videoGame' ? 'Video Game' : 'Pocket',
      status: checked ? 'enabled' : 'disabled',
    }));
  };

  return (
    <>
      <Header><T id="preferences.header">Preferences</T></Header>
      <Tabs
        defaultValue='account'
        orientation='vertical'
        className='flex flex-col md:flex-row gap-4 md:gap-8 h-full'
      >
        <TabsList className='md:flex-col w-full md:w-[200px] h-full gap-2 md:p-2'>
          <TabsTrigger value='account' className='w-full'>
            <T id="preferences.tabs.account">Account</T>
          </TabsTrigger>
          <TabsTrigger value='appearance' className='w-full'>
            <T id="preferences.tabs.appearance">Appearance</T>
          </TabsTrigger>
          <TabsTrigger value='notifications' className='w-full'>
            <T id="preferences.tabs.notifications">Notifications</T>
          </TabsTrigger>
          <TabsTrigger value='privacy' className='w-full'>
            <T id="preferences.tabs.privacy">Privacy</T>
          </TabsTrigger>
          <TabsTrigger value='gameplay' className='w-full'>
            <T id="preferences.tabs.gameplay">Gameplay</T>
          </TabsTrigger>
          <TabsTrigger value='games' className='w-full'>
            <T id="preferences.tabs.games">Games</T>
          </TabsTrigger>
        </TabsList>

        <TabsContent value='account' className='w-full'>
          <Card>
            <CardHeader>
              <CardTitle><T id="preferences.account.title">Account Settings</T></CardTitle>
              <CardDescription><T id="preferences.account.description">Manage your account preferences</T></CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex justify-between items-center'>
                <Label><T id="preferences.account.avatar">Avatar</T></Label>
                <AvatarSelector userId={user.id} avatarImages={avatarImages} />
              </div>
              <Separator />
              <div className='flex justify-between items-center'>
                <Label><T id="preferences.account.screenName">PTCG Live screen name</T></Label>
                <ScreenNameEditable userId={user.id} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='appearance' className='w-full'>
          <Card>
            <CardHeader>
              <CardTitle><T id="preferences.appearance.title">Appearance Settings</T></CardTitle>
              <CardDescription><T id="preferences.appearance.description">Customize how the app looks</T></CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex justify-between items-center'>
                <Label><T id="preferences.appearance.theme">Theme</T></Label>
                <Select value={preferences.theme} onValueChange={handleThemeChange}>
                  <SelectTrigger className='w-[180px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='light'><T id="preferences.theme.light">Light</T></SelectItem>
                    <SelectItem value='dark'><T id="preferences.theme.dark">Dark</T></SelectItem>
                    <SelectItem value='system'><T id="preferences.theme.system">System</T></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className='flex justify-between items-center'>
                <Label><T id="preferences.appearance.dateFormat">Date Format</T></Label>
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
                <h3 className='font-medium'><T id="preferences.display.title">Display Options</T></h3>
                <div className='flex justify-between items-center'>
                  <Label><T id="preferences.display.compactView">Compact View</T></Label>
                  <Switch
                    checked={preferences.display.compactView}
                    onCheckedChange={(checked) => handleDisplayToggle('compactView', checked)}
                  />
                </div>
                <div className='flex justify-between items-center'>
                  <Label><T id="preferences.display.showAvatars">Show Avatars</T></Label>
                  <Switch
                    checked={preferences.display.showAvatars}
                    onCheckedChange={(checked) => handleDisplayToggle('showAvatars', checked)}
                  />
                </div>
                <div className='flex justify-between items-center'>
                  <Label><T id="preferences.display.enableAnimations">Enable Animations</T></Label>
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
              <CardTitle><T id="preferences.notifications.title">Notification Settings</T></CardTitle>
              <CardDescription><T id="preferences.notifications.description">Control how you receive notifications</T></CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex justify-between items-center'>
                <Label><T id="preferences.notifications.email">Email Notifications</T></Label>
                <Switch
                  checked={preferences.notifications.email}
                  onCheckedChange={(checked) => handleNotificationToggle('email', checked)}
                />
              </div>
              <div className='flex justify-between items-center'>
                <Label><T id="preferences.notifications.push">Push Notifications</T></Label>
                <Switch
                  checked={preferences.notifications.push}
                  onCheckedChange={(checked) => handleNotificationToggle('push', checked)}
                />
              </div>
              <div className='flex justify-between items-center'>
                <Label><T id="preferences.notifications.inApp">In-App Notifications</T></Label>
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
              <CardTitle><T id="preferences.privacy.title">Privacy Settings</T></CardTitle>
              <CardDescription><T id="preferences.privacy.description">Control your privacy and visibility</T></CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex justify-between items-center'>
                <Label><T id="preferences.privacy.profileVisibility">Profile Visibility</T></Label>
                <Select 
                  value={preferences.privacy.profileVisibility} 
                  onValueChange={(value) => handlePrivacyToggle('profileVisibility', value)}
                >
                  <SelectTrigger className='w-[180px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='public'><T id="preferences.privacy.public">Public</T></SelectItem>
                    <SelectItem value='friends'><T id="preferences.privacy.friendsOnly">Friends Only</T></SelectItem>
                    <SelectItem value='private'><T id="preferences.privacy.private">Private</T></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='flex justify-between items-center'>
                <Label><T id="preferences.privacy.showStats">Show Stats</T></Label>
                <Switch
                  checked={preferences.privacy.showStats}
                  onCheckedChange={(checked) => handlePrivacyToggle('showStats', checked)}
                />
              </div>
              <div className='flex justify-between items-center'>
                <Label><T id="preferences.privacy.showBattleLogs">Show Battle Logs</T></Label>
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
              <CardTitle><T id="preferences.gameplay.title">Gameplay Settings</T></CardTitle>
              <CardDescription><T id="preferences.gameplay.description">Customize your gameplay experience</T></CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex justify-between items-center'>
                <Label><T id="preferences.gameplay.defaultFormat">Default Format</T></Label>
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
                <Label><T id="preferences.gameplay.autoImportLogs">Auto Import Logs</T></Label>
                <Switch
                  checked={preferences.gameplay.autoImportLogs}
                  onCheckedChange={(checked) => handleGameplayToggle('autoImportLogs', checked)}
                />
              </div>
              <div className='flex justify-between items-center'>
                <Label><T id="preferences.gameplay.confirmBeforeDelete">Confirm Before Delete</T></Label>
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
              <CardTitle><T id="preferences.games.title">Game Settings</T></CardTitle>
              <CardDescription><T id="preferences.games.description">Choose which games you want to show in the application.</T></CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex justify-between items-center'>
                <div>
                  <Label>Pokemon TCG</Label>
                  <p className='text-sm text-muted-foreground'><T id="preferences.games.showTcg">Show TCG section in sidebar</T></p>
                </div>
                <Switch
                  checked={preferences.games.tradingCardGame}
                  onCheckedChange={(checked) => handleGameToggle('tradingCardGame', checked)}
                />
              </div>
              <Separator />
              <div className='flex justify-between items-center'>
                <div>
                  <Label><T id="preferences.games.videoGame">Video Game</T></Label>
                  <p className='text-sm text-muted-foreground'><T id="preferences.games.showVgc">Show VGC section in sidebar</T></p>
                </div>
                <Switch
                  checked={preferences.games.videoGame}
                  onCheckedChange={(checked) => handleGameToggle('videoGame', checked)}
                />
              </div>
              <Separator />
              <div className='flex justify-between items-center'>
                <div>
                  <Label><T id="preferences.games.pocket">Pocket</T></Label>
                  <p className='text-sm text-muted-foreground'><T id="preferences.games.showPocket">Show Pocket section in sidebar</T></p>
                </div>
                <Switch
                  checked={preferences.games.pocket}
                  onCheckedChange={(checked) => handleGameToggle('pocket', checked)}
                />
              </div>
              <div className='mt-4 p-4 bg-muted rounded-lg'>
                <p className='text-sm text-muted-foreground'>
                  <T id="preferences.games.note">Note: You must have at least one game enabled to use Training Court.</T>
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
            showSuccessToast(gt('Preferences reset to defaults', { $id: 'preferences.toast.reset' }));
          }}
        >
          <T id="preferences.resetToDefaults">Reset to Defaults</T>
        </Button>
      </div>
    </>
  );
}
