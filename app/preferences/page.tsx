import { fetchAvatarImages } from '@/components/avatar/avatar.server.utils';
import { PreferencesPageClient } from './PreferencesPageClient';

export default function PreferencesPage() {
  // Filesystem read (no auth) — runs at build/request time on the server
  const avatars = fetchAvatarImages();

  return <PreferencesPageClient avatarImages={avatars} />;
}
