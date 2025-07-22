'use client';

import { PlusIcon } from "lucide-react";
import { getAvatarSrc } from "../avatar/avatar.utils";
import { AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { CopySharableLinkButton } from "./CopySharableLinkButton";
import { useFriends } from "@/app/recoil/hooks/useFriends";
import { useAuth } from "@/app/recoil/hooks/useAuth";
import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Friend } from "@/app/recoil/atoms/friends";
import { Skeleton } from "../ui/skeleton";

export const FriendsDisplayRecoil = () => {
  const { user, isAuthenticated } = useAuth();
  const { 
    friendsWithProfile, 
    pendingRequests,
    loading, 
    loadFriends,
    acceptFriendRequest,
    declineFriendRequest 
  } = useFriends();

  useEffect(() => {
    if (!user?.id) return;

    const fetchFriendsData = async () => {
      try {
        const supabase = createClient();
        
        // Fetch accepted friends
        const { data: friendsData, error: friendsError } = await supabase
          .from('friends')
          .select(`
            *,
            friend:friend_id(
              id,
              name,
              avatar,
              live_screen_name
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'accepted');

        if (friendsError) throw friendsError;

        // Fetch pending friend requests
        const { data: requestsData, error: requestsError } = await supabase
          .from('friend_requests')
          .select(`
            *,
            fromUser:from_user_id(
              id,
              name,
              avatar,
              live_screen_name
            )
          `)
          .eq('to_user_id', user.id)
          .eq('status', 'pending');

        if (requestsError) throw requestsError;

        if (friendsData) {
          const friends: Friend[] = friendsData.map(f => ({
            id: f.id,
            userId: f.user_id,
            friendId: f.friend_id,
            status: f.status,
            createdAt: f.created_at,
            updatedAt: f.updated_at,
            friendProfile: f.friend ? {
              id: f.friend.id,
              name: f.friend.name,
              avatar: f.friend.avatar,
              isOnline: false,
              lastSeen: undefined,
            } : undefined,
          }));
          
          loadFriends(friends);
        }

        if (requestsData) {
          // Process friend requests
          // This would be handled by loadFriendRequests if implemented
        }
      } catch (error) {
        console.error('Failed to load friends:', error);
      }
    };

    fetchFriendsData();
  }, [user?.id, loadFriends]);

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Friends</CardTitle>
        </CardHeader>
        <CardContent>
          <Label>Please log in to view your friends.</Label>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          Friends 
          {friendsWithProfile.length > 0 && (
            <span className="ml-2 text-sm text-muted-foreground">
              ({friendsWithProfile.length})
            </span>
          )}
        </CardTitle>
        {user && <CopySharableLinkButton userId={user.id} />}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            {/* Pending Friend Requests */}
            {pendingRequests.length > 0 && (
              <div className="mb-4">
                <Label className="text-sm font-medium mb-2">Pending Requests</Label>
                {pendingRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-2 border rounded mb-2">
                    <div className="flex gap-2 items-center">
                      {request.fromUserProfile?.avatar && (
                        <img 
                          className="h-8 w-8 pixel-image" 
                          src={getAvatarSrc(request.fromUserProfile.avatar)} 
                        />
                      )}
                      <Label>{request.fromUserProfile?.name || 'Unknown'}</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acceptFriendRequest(request.id)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => declineFriendRequest(request.id)}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Friends List */}
            {(!friendsWithProfile || friendsWithProfile.length === 0) && pendingRequests.length === 0 && (
              <Label>{`You have no friends :(`}</Label>
            )}
            
            <div className="space-y-2">
              {friendsWithProfile.map((friend) => (
                <div key={friend.id} className="flex gap-2 items-center p-2 hover:bg-secondary rounded">
                  {friend.friendProfile?.avatar && (
                    <img 
                      className="h-10 w-10 pixel-image" 
                      src={getAvatarSrc(friend.friendProfile.avatar)} 
                    />
                  )}
                  <div className="flex-1">
                    <Label>{friend.friendProfile?.name || 'Unknown'}</Label>
                    {friend.isOnline !== undefined && (
                      <div className="text-xs text-muted-foreground">
                        {friend.isOnline ? (
                          <span className="text-green-500">● Online</span>
                        ) : (
                          <span>● Offline</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};