'use client';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import { FriendRequestAcceptPage } from '@/components/friends/friend-requests/FriendRequestAcceptPage';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { FriendRequestWithUserData } from '@/components/friends/friend-requests/friend-requests.server.utils';

export function FriendRequestPageClient({ requestId }: { requestId: string }) {
  const { user, loading } = useAuthGuard();
  const [friendRequest, setFriendRequest] = useState<FriendRequestWithUserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchRequest = async () => {
      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('friend requests')
          .select('id, created_at, user_sending ( * ), uses_remaining')
          .eq('id', requestId)
          .returns<FriendRequestWithUserData[]>()
          .maybeSingle();

        if (fetchError || !data) {
          setError('Friend request not found.');
          return;
        }

        if (data.uses_remaining === 0) {
          setError('Friend request has expired. Ask your friend to send a new one!');
          return;
        }

        setFriendRequest(data);
      } catch {
        setError('Failed to load friend request.');
      } finally {
        setFetching(false);
      }
    };

    fetchRequest();
  }, [user, requestId]);

  if (loading || !user) return null;

  if (fetching && !error) {
    return (
      <div className="flex-1 flex flex-col w-full h-full sm:max-w-lg justify-center items-center p-4">
        <Label>Loading friend request...</Label>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col w-full h-full sm:max-w-lg justify-between gap-2 p-4">
        <Label>{error}</Label>
        <Link href='/home'>
          <Button>Home</Button>
        </Link>
      </div>
    );
  }

  if (!friendRequest) return null;

  if (user.id === friendRequest.user_sending.id) {
    return (
      <div className="flex-1 flex flex-col w-full h-full sm:max-w-lg justify-between gap-2 p-4">
        <Label>You can't accept your own friend request silly!</Label>
        <Link href='/home'>
          <Button>Home</Button>
        </Link>
      </div>
    );
  }

  return <FriendRequestAcceptPage accepterUserId={user.id} friendRequestData={friendRequest} />;
}
