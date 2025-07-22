import { fetchAvatarImages } from '@/components/avatar/avatar.server.utils';
import { PreferencesPageClient } from '@/components/preferences/PreferencesPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Preferences',
};

export default async function PreferencesPage() {
  const avatars = await fetchAvatarImages();

  return <PreferencesPageClient avatarImages={avatars} />;
}