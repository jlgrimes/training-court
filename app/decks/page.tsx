import { Metadata } from 'next';
import { fetchCurrentUser } from '@/components/auth.utils';
import { redirect } from 'next/navigation';
import { MyDecksClient } from '@/components/decks/MyDecksClient';

export const metadata: Metadata = {
  title: 'My Decks | Training Court',
  description: 'Manage your Pokemon TCG decks',
};

export default async function DecksPage() {
  const user = await fetchCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">My Decks</h1>
      <MyDecksClient userId={user.id} />
    </div>
  );
}