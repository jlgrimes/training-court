'use client';

import { useRecoilState, useRecoilValue } from 'recoil';
import { useCallback } from 'react';
import {
  friendsAtom,
  friendRequestsAtom,
  pendingFriendRequestsCountAtom,
  onlineFriendsAtom,
  friendsLoadingAtom,
  Friend,
  FriendRequest,
} from '../atoms/friends';
import {
  acceptedFriendsSelector,
  pendingFriendRequestsSelector,
  onlineFriendsSelector,
  friendsWithProfileSelector,
} from '../selectors/friends';

export function useFriends() {
  const [friends, setFriends] = useRecoilState(friendsAtom);
  const [friendRequests, setFriendRequests] = useRecoilState(friendRequestsAtom);
  const [pendingCount, setPendingCount] = useRecoilState(pendingFriendRequestsCountAtom);
  const [onlineFriendIds, setOnlineFriendIds] = useRecoilState(onlineFriendsAtom);
  const [loading, setLoading] = useRecoilState(friendsLoadingAtom);
  
  const acceptedFriends = useRecoilValue(acceptedFriendsSelector);
  const pendingRequests = useRecoilValue(pendingFriendRequestsSelector);
  const onlineFriends = useRecoilValue(onlineFriendsSelector);
  const friendsWithProfile = useRecoilValue(friendsWithProfileSelector);

  const addFriend = useCallback((friend: Friend) => {
    setFriends(prev => [...prev, friend]);
  }, [setFriends]);

  const updateFriend = useCallback((id: string, updates: Partial<Friend>) => {
    setFriends(prev => 
      prev.map(friend => friend.id === id ? { ...friend, ...updates } : friend)
    );
  }, [setFriends]);

  const removeFriend = useCallback((id: string) => {
    setFriends(prev => prev.filter(friend => friend.id !== id));
  }, [setFriends]);

  const sendFriendRequest = useCallback((request: FriendRequest) => {
    setFriendRequests(prev => [...prev, request]);
  }, [setFriendRequests]);

  const acceptFriendRequest = useCallback((requestId: string) => {
    setFriendRequests(prev => 
      prev.map(request => 
        request.id === requestId 
          ? { ...request, status: 'accepted' as const }
          : request
      )
    );
    setPendingCount(prev => Math.max(0, prev - 1));
  }, [setFriendRequests, setPendingCount]);

  const declineFriendRequest = useCallback((requestId: string) => {
    setFriendRequests(prev => 
      prev.map(request => 
        request.id === requestId 
          ? { ...request, status: 'declined' as const }
          : request
      )
    );
    setPendingCount(prev => Math.max(0, prev - 1));
  }, [setFriendRequests, setPendingCount]);

  const updateOnlineStatus = useCallback((friendIds: string[]) => {
    setOnlineFriendIds(friendIds);
  }, [setOnlineFriendIds]);

  const loadFriends = useCallback(async (friendsList: Friend[]) => {
    setLoading(true);
    try {
      setFriends(friendsList);
      const pendingCount = friendsList.filter(f => f.status === 'pending').length;
      setPendingCount(pendingCount);
    } finally {
      setLoading(false);
    }
  }, [setFriends, setPendingCount, setLoading]);

  const loadFriendRequests = useCallback(async (requests: FriendRequest[]) => {
    setFriendRequests(requests);
    const pendingCount = requests.filter(r => r.status === 'pending').length;
    setPendingCount(pendingCount);
  }, [setFriendRequests, setPendingCount]);

  return {
    friends,
    acceptedFriends,
    friendRequests,
    pendingRequests,
    pendingCount,
    onlineFriends,
    friendsWithProfile,
    loading,
    addFriend,
    updateFriend,
    removeFriend,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    updateOnlineStatus,
    loadFriends,
    loadFriendRequests,
  };
}