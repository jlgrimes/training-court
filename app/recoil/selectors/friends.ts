'use client';

import { selector } from 'recoil';
import { friendsAtom, friendRequestsAtom, onlineFriendsAtom } from '../atoms/friends';

export const acceptedFriendsSelector = selector({
  key: 'acceptedFriendsSelector',
  get: ({ get }) => {
    const friends = get(friendsAtom);
    return friends.filter(friend => friend.status === 'accepted');
  },
});

export const pendingFriendRequestsSelector = selector({
  key: 'pendingFriendRequestsSelector',
  get: ({ get }) => {
    const requests = get(friendRequestsAtom);
    return requests.filter(request => request.status === 'pending');
  },
});

export const onlineFriendsSelector = selector({
  key: 'onlineFriendsSelector',
  get: ({ get }) => {
    const friends = get(acceptedFriendsSelector);
    const onlineIds = get(onlineFriendsAtom);
    
    return friends.filter(friend => 
      onlineIds.includes(friend.friendId)
    );
  },
});

export const friendsWithProfileSelector = selector({
  key: 'friendsWithProfileSelector',
  get: ({ get }) => {
    const friends = get(acceptedFriendsSelector);
    const onlineIds = get(onlineFriendsAtom);
    
    return friends.map(friend => ({
      ...friend,
      isOnline: onlineIds.includes(friend.friendId),
    }));
  },
});