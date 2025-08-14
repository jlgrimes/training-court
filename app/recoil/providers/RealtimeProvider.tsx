'use client';

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '../hooks/useAuth';
import { useBattleLogs } from '../hooks/useBattleLogs';
import { useTournaments } from '../hooks/useTournaments';
import { useFriends } from '../hooks/useFriends';
import { useNotifications } from '../hooks/useNotifications';
import { BattleLog } from '../atoms/battle-logs';
import { Tournament, TournamentRound } from '../atoms/tournaments';
import { Friend, FriendRequest } from '../atoms/friends';
import { Notification } from '../atoms/notifications';

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { addBattleLog, updateBattleLog, deleteBattleLog } = useBattleLogs();
  const { addTournament, updateTournament, deleteTournament, addRound, updateRound } = useTournaments();
  const { addFriend, updateFriend, removeFriend, updateOnlineStatus } = useFriends();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!user?.id) return;

    const supabase = createClient();

    // Battle Logs Subscription
    const battleLogsChannel = supabase
      .channel('battle-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'logs',
          filter: `user=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const log = payload.new as any;
            const battleLog: BattleLog = {
              id: log.id,
              user: log.user,
              log: log.log,
              userDeck: log.archetype || undefined,
              oppDeck: log.opp_archetype || undefined,
              format: log.format || undefined,
              timestamp: log.timestamp || undefined,
              winLoss: log.win_loss as 'W' | 'L' | 'T' | undefined,
              createdAt: log.created_at || undefined,
            };
            addBattleLog(battleLog);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const log = payload.new as any;
            updateBattleLog(log.id, log);
          } else if (payload.eventType === 'DELETE' && payload.old) {
            deleteBattleLog((payload.old as any).id);
          }
        }
      )
      .subscribe();

    // Tournaments Subscription
    const tournamentsChannel = supabase
      .channel('tournaments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournaments',
          filter: `user=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const t = payload.new as any;
            const tournament: Tournament = {
              id: t.id,
              name: t.name,
              deckName: t.deckname || '',
              startDate: t.date_from || undefined,
              endDate: t.date_to || undefined,
              placement: t.placement || undefined,
              playersCount: t.players_count || undefined,
              user: t.user || undefined,
              createdAt: t.created_at || undefined,
            };
            addTournament(tournament);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const t = payload.new as any;
            updateTournament(t.id, t);
          } else if (payload.eventType === 'DELETE' && payload.old) {
            deleteTournament((payload.old as any).id);
          }
        }
      )
      .subscribe();

    // Tournament Rounds Subscription
    const roundsChannel = supabase
      .channel('tournament-rounds-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament rounds',
          filter: `user=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const r = payload.new as any;
            const round: TournamentRound = {
              id: r.id,
              tournamentId: r.tournament_id,
              roundNumber: r.round_num || 0,
              opponentDeck: r.opp_archetype || undefined,
              win: r.win || undefined,
              loss: r.loss || undefined,
              tie: r.tie || undefined,
              tableName: r.table_num || undefined,
              day: r.day || undefined,
              notes: r.notes || undefined,
            };
            addRound(round);
          }
        }
      )
      .subscribe();

    // Friends Subscription
    const friendsChannel = supabase
      .channel('friends-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friends',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const f = payload.new as any;
            const friend: Friend = {
              id: f.id,
              userId: f.user_id,
              friendId: f.friend_id,
              status: f.status,
              createdAt: f.created_at,
              updatedAt: f.updated_at,
            };
            addFriend(friend);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const f = payload.new as any;
            updateFriend(f.id, f);
          } else if (payload.eventType === 'DELETE' && payload.old) {
            removeFriend((payload.old as any).id);
          }
        }
      )
      .subscribe();

    // Notifications Subscription
    const notificationsChannel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            const n = payload.new as any;
            const notification: Notification = {
              id: n.id,
              type: n.type,
              title: n.title,
              message: n.message,
              read: n.read || false,
              actionUrl: n.action_url || undefined,
              actionLabel: n.action_label || undefined,
              createdAt: n.created_at,
              expiresAt: n.expires_at || undefined,
              metadata: n.metadata || undefined,
            };
            addNotification(notification);
          }
        }
      )
      .subscribe();

    // Presence for online status
    const presenceChannel = supabase.channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const onlineUserIds = Object.keys(state).map(key => (state[key][0] as any).user_id);
        updateOnlineStatus(onlineUserIds);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: user.id });
        }
      });

    // Cleanup
    return () => {
      battleLogsChannel.unsubscribe();
      tournamentsChannel.unsubscribe();
      roundsChannel.unsubscribe();
      friendsChannel.unsubscribe();
      notificationsChannel.unsubscribe();
      presenceChannel.unsubscribe();
    };
  }, [
    user?.id,
    addBattleLog,
    updateBattleLog,
    deleteBattleLog,
    addTournament,
    updateTournament,
    deleteTournament,
    addRound,
    addFriend,
    updateFriend,
    removeFriend,
    addNotification,
    updateOnlineStatus,
  ]);

  return <>{children}</>;
}