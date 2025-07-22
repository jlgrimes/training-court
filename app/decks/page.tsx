import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { MyDecksClient } from '@/components/decks/MyDecksClient';

export const metadata: Metadata = {
  title: 'My Decks | Training Court',
  description: 'Manage your Pokemon TCG decks',
};

export default async function DecksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <MyDecksClient userId={user.id} />;
}