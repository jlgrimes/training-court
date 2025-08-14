'use client';

import { atom } from 'recoil';

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  createdAt?: string;
  updatedAt?: string;
  friendProfile?: {
    id: string;
    name?: string;
    avatar?: string;
    isOnline?: boolean;
    lastSeen?: string;
  };
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  createdAt?: string;
  fromUserProfile?: {
    id: string;
    name?: string;
    avatar?: string;
  };
}

export const friendsAtom = atom<Friend[]>({
  key: 'friendsState',
  default: [],
});

export const friendRequestsAtom = atom<FriendRequest[]>({
  key: 'friendRequestsState',
  default: [],
});

export const pendingFriendRequestsCountAtom = atom<number>({
  key: 'pendingFriendRequestsCountState',
  default: 0,
});

export const onlineFriendsAtom = atom<string[]>({
  key: 'onlineFriendsState',
  default: [],
});

export const friendsLoadingAtom = atom<boolean>({
  key: 'friendsLoadingState',
  default: false,
});