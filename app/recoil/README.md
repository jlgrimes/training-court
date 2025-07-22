# Training Court State Management

This directory contains the comprehensive Recoil state management implementation for the Training Court application.

## Structure

```
/app/recoil/
├── atoms/              # State atoms (basic units of state)
│   ├── user.ts        # User authentication and profile
│   ├── battle-logs.ts # Battle logs state
│   ├── tournaments.ts # Tournament management
│   ├── ui.ts         # UI state (modals, toasts, theme)
│   ├── friends.ts    # Friend system
│   ├── notifications.ts # Notifications
│   ├── pocket.ts     # Pokemon TCG Pocket
│   └── preferences.ts # User preferences
├── selectors/         # Derived state and computed values
├── hooks/            # Custom hooks for state management
├── effects/          # Side effects and persistence
└── implementations/  # Example implementations

```

## Usage

### 1. Basic State Access

```typescript
import { useBattleLogs } from '@/app/recoil';

function MyComponent() {
  const { battleLogs, loading, filter, setFilterField } = useBattleLogs();
  
  return (
    <div>
      {/* Your UI */}
    </div>
  );
}
```

### 2. Authentication State

```typescript
import { useAuth } from '@/app/recoil';

function ProtectedComponent() {
  const { user, isAuthenticated, isPremium } = useAuth();
  
  if (!isAuthenticated) {
    return <LoginPrompt />;
  }
  
  return <YourContent />;
}
```

### 3. UI State Management

```typescript
import { useUI } from '@/app/recoil';

function MyComponent() {
  const { showSuccessToast, showErrorToast, openModal } = useUI();
  
  const handleAction = async () => {
    try {
      await doSomething();
      showSuccessToast('Action completed!');
    } catch (error) {
      showErrorToast('Something went wrong');
    }
  };
}
```

### 4. State with Persistence

```typescript
import { atom } from 'recoil';
import { localStorageEffect } from '@/app/recoil';

const myPersistedState = atom({
  key: 'myPersistedState',
  default: {},
  effects: [localStorageEffect('my-state-key')],
});
```

## Available Hooks

### `useAuth()`
- `user`: Current user object
- `userProfile`: User profile data
- `isAuthenticated`: Authentication status
- `isPremium`: Premium user status
- `isAdmin`: Admin status
- `login()`: Login function
- `logout()`: Logout function
- `updateProfile()`: Update user profile

### `useBattleLogs()`
- `battleLogs`: All battle logs
- `filteredLogs`: Filtered battle logs
- `paginatedLogs`: Paginated results
- `stats`: Battle log statistics
- `filter`: Current filters
- `sort`: Sort options
- `loading`: Loading state
- State management functions

### `useTournaments()`
- `tournaments`: All tournaments
- `filteredTournaments`: Filtered tournaments
- `stats`: Tournament statistics
- `selectedTournament`: Currently selected tournament
- `editMode`: Edit mode state
- Tournament CRUD operations

### `useUI()`
- `darkMode`: Dark mode state
- `theme`: Current theme
- `showToast()`: Show toast notification
- `showSuccessToast()`: Show success toast
- `showErrorToast()`: Show error toast
- `openModal()`: Open modal
- `closeModal()`: Close modal
- UI toggle functions

### `useFriends()`
- `friends`: Friends list
- `pendingRequests`: Pending friend requests
- `onlineFriends`: Online friends
- Friend request management functions

### `useNotifications()`
- `notifications`: All notifications
- `unreadCount`: Unread notification count
- `markAsRead()`: Mark notification as read
- `deleteNotification()`: Delete notification
- Notification preferences

### `usePreferences()`
- `preferences`: User preferences
- `updatePreference()`: Update single preference
- `updateNestedPreference()`: Update nested preference
- `resetPreferences()`: Reset to defaults

## State Persistence

The system supports multiple persistence strategies:

1. **Local Storage**: For user preferences and UI state
2. **Session Storage**: For temporary state
3. **URL Sync**: For shareable state (filters, page numbers)
4. **Supabase Sync**: For database-backed state

## Best Practices

1. **Use hooks instead of direct atom access**
   ```typescript
   // Good
   const { battleLogs, addBattleLog } = useBattleLogs();
   
   // Avoid
   const [battleLogs, setBattleLogs] = useRecoilState(battleLogsAtom);
   ```

2. **Leverage selectors for derived state**
   ```typescript
   // Stats are automatically computed from filtered logs
   const { stats } = useBattleLogs();
   ```

3. **Handle loading states properly**
   ```typescript
   const { loading, battleLogs } = useBattleLogs();
   
   if (loading) return <Skeleton />;
   ```

4. **Use type-safe state updates**
   ```typescript
   const { setFilterField } = useBattleLogs();
   setFilterField('format', 'Standard'); // Type-safe
   ```

## Migration Guide

To migrate existing components to use Recoil:

1. Replace local state with Recoil hooks
2. Remove prop drilling
3. Update data fetching to use Recoil effects
4. Consolidate duplicate state logic

Example migration:
```typescript
// Before
const [logs, setLogs] = useState([]);
const [loading, setLoading] = useState(false);

// After
const { battleLogs, loading, loadBattleLogs } = useBattleLogs();
```

## Performance Optimization

1. **Use selectors for expensive computations**
2. **Implement pagination at the selector level**
3. **Use React.memo() for components that consume state**
4. **Batch state updates when possible**

## Testing

When testing components with Recoil:

```typescript
import { RecoilRoot } from 'recoil';
import { render } from '@testing-library/react';

test('my component', () => {
  render(
    <RecoilRoot>
      <MyComponent />
    </RecoilRoot>
  );
});
```