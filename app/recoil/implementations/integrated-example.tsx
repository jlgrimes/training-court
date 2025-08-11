'use client';

import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useBattleLogs } from '../hooks/useBattleLogs';
import { useTournaments } from '../hooks/useTournaments';
import { useUI } from '../hooks/useUI';
import { useFriends } from '../hooks/useFriends';
import { useNotifications } from '../hooks/useNotifications';
import { usePreferences } from '../hooks/usePreferences';

// Example: Updated Battle Logs Container using Recoil
export function BattleLogsContainerWithRecoil() {
  const { user, isAuthenticated } = useAuth();
  const {
    paginatedLogs,
    stats,
    filter,
    sort,
    loading,
    page,
    setPage,
    setFilterField,
    setSortField,
    selectedLog,
    setSelectedLog,
    deleteBattleLog,
  } = useBattleLogs();
  const { showSuccessToast, showErrorToast, openModal, closeModal } = useUI();
  
  const handleDelete = async (logId: string) => {
    try {
      deleteBattleLog(logId);
      showSuccessToast('Battle log deleted successfully');
    } catch (error) {
      showErrorToast('Failed to delete battle log');
    }
  };
  
  const handleViewDetails = (log: any) => {
    setSelectedLog(log);
    openModal({
      title: 'Battle Log Details',
      content: <BattleLogDetailsModal log={log} />,
    });
  };
  
  if (!isAuthenticated) {
    return <div>Please login to view battle logs</div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Your existing UI with Recoil state */}
    </div>
  );
}

// Example: Tournament Management with Recoil
export function TournamentManagerWithRecoil() {
  const { user } = useAuth();
  const {
    sortedTournaments,
    selectedTournament,
    editMode,
    rounds,
    setSelectedTournament,
    setEditMode,
    updateTournament,
    addRound,
    updateRound,
    deleteRound,
  } = useTournaments();
  const { showSuccessToast, showErrorToast, setLoadingOverlay } = useUI();
  const { preferences } = usePreferences();
  
  const handleSaveTournament = async () => {
    setLoadingOverlay(true);
    try {
      if (selectedTournament) {
        await updateTournament(selectedTournament.id, {
          ...selectedTournament,
          rounds,
        });
        showSuccessToast('Tournament saved successfully');
        setEditMode(false);
      }
    } catch (error) {
      showErrorToast('Failed to save tournament');
    } finally {
      setLoadingOverlay(false);
    }
  };
  
  return (
    <div>
      {/* Tournament UI implementation */}
    </div>
  );
}

// Example: Friend System with Recoil
export function FriendSystemWithRecoil() {
  const { user } = useAuth();
  const {
    friendsWithProfile,
    pendingRequests,
    pendingCount,
    acceptFriendRequest,
    declineFriendRequest,
    loading,
  } = useFriends();
  const { addNotification } = useNotifications();
  const { showSuccessToast } = useUI();
  
  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      showSuccessToast('Friend request accepted');
      addNotification({
        id: Date.now().toString(),
        type: 'friend_request',
        title: 'Friend Request Accepted',
        message: 'You have a new friend!',
        read: false,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    }
  };
  
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold">
          Friends {pendingCount > 0 && (
            <span className="ml-2 px-2 py-1 text-sm bg-red-500 text-white rounded-full">
              {pendingCount}
            </span>
          )}
        </h2>
      </div>
      
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Pending Requests</h3>
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 border rounded">
                <div>
                  <p className="font-medium">{request.fromUserProfile?.name}</p>
                  <p className="text-sm text-gray-500">{request.message}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptRequest(request.id)}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => declineFriendRequest(request.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Friends List */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Your Friends</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {friendsWithProfile.map((friend) => (
            <div key={friend.id} className="flex items-center p-4 border rounded">
              <div className="flex-1">
                <p className="font-medium">{friend.friendProfile?.name}</p>
                <p className="text-sm text-gray-500">
                  {friend.isOnline ? (
                    <span className="text-green-500">● Online</span>
                  ) : (
                    <span className="text-gray-400">● Offline</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Example: Notification Center with Recoil
export function NotificationCenterWithRecoil() {
  const {
    filteredNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    preferences,
    updatePreferences,
  } = useNotifications();
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          Notifications {unreadCount > 0 && (
            <span className="ml-2 px-2 py-1 text-sm bg-red-500 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </h2>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>
      
      {/* Notification Preferences */}
      <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded">
        <h3 className="font-medium mb-2">Notification Preferences</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.friendRequests}
              onChange={(e) => updatePreferences({ friendRequests: e.target.checked })}
              className="mr-2"
            />
            Friend Requests
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.tournamentInvites}
              onChange={(e) => updatePreferences({ tournamentInvites: e.target.checked })}
              className="mr-2"
            />
            Tournament Invites
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.battleLogShares}
              onChange={(e) => updatePreferences({ battleLogShares: e.target.checked })}
              className="mr-2"
            />
            Battle Log Shares
          </label>
        </div>
      </div>
      
      {/* Notifications List */}
      <div className="space-y-2">
        {filteredNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 border rounded ${
              !notification.read ? 'bg-blue-50 dark:bg-blue-900' : ''
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium">{notification.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notification.createdAt).toDateString()}
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Mark as read
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notification.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
            {notification.actionUrl && (
              <a
                href={notification.actionUrl}
                className="inline-block mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                {notification.actionLabel || 'View'}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Example: Theme and UI Preferences
export function ThemePreferencesWithRecoil() {
  const { preferences, updatePreference, updateNestedPreference } = usePreferences();
  const { theme, toggleDarkMode } = useUI();
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Appearance Settings</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Theme</label>
          <select
            value={preferences.theme}
            onChange={(e) => updatePreference('theme', e.target.value as any)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Date Format</label>
          <select
            value={preferences.dateFormat}
            onChange={(e) => updatePreference('dateFormat', e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Display Options</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.display.compactView}
                onChange={(e) => updateNestedPreference('display', 'compactView', e.target.checked)}
                className="mr-2"
              />
              Compact View
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.display.showAvatars}
                onChange={(e) => updateNestedPreference('display', 'showAvatars', e.target.checked)}
                className="mr-2"
              />
              Show Avatars
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.display.animationsEnabled}
                onChange={(e) => updateNestedPreference('display', 'animationsEnabled', e.target.checked)}
                className="mr-2"
              />
              Enable Animations
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component
function BattleLogDetailsModal({ log }: { log: any }) {
  return (
    <div>
      <h3 className="font-bold">{log.userDeck} vs {log.oppDeck}</h3>
      <p>Format: {log.format}</p>
      <p>Result: {log.winLoss}</p>
      {log.logNotes && <p>Notes: {log.logNotes}</p>}
    </div>
  );
}