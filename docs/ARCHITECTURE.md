# Training Court Architecture

This document describes the architecture and key patterns used in Training Court.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (cookie-based SSR)
- **State Management**: Recoil + SWR
- **UI**: Radix UI + Tailwind CSS
- **Deployment**: Vercel

## Directory Structure

```
├── app/                    # Next.js App Router pages
│   ├── home/              # Main authenticated dashboard
│   ├── login/             # Authentication
│   ├── ptcg/              # Pokemon TCG routes
│   ├── pocket/            # Pokemon Pocket routes
│   ├── api/               # API route handlers
│   └── recoil/            # Recoil state management
├── components/            # React components
│   ├── battle-logs/       # Battle log components
│   ├── tournaments/       # Tournament components
│   ├── pocket/            # Pokemon Pocket components
│   ├── ui/                # Shadcn/Radix UI primitives
│   └── preferences/       # User preferences
├── hooks/                 # Custom React hooks (SWR-based)
│   ├── logs/              # Battle log hooks
│   ├── tournaments/       # Tournament hooks
│   ├── pocket/            # Pocket game hooks
│   └── user-data/         # User data hooks
├── lib/                   # Utilities and helpers
│   ├── server/            # Server-only utilities
│   └── game-preferences.ts
├── utils/
│   └── supabase/          # Supabase client setup
└── database.types.ts      # Auto-generated DB types
```

## Self-Contained Server Component Widgets

The key architectural pattern in Training Court is **self-contained server component widgets**. Each preview component on the home page is a server component that:

1. Fetches its own data server-side
2. Renders a client component for interactivity
3. Can be placed on any page without coordination

### Widget Structure

```
ComponentPreview (Server Component)
├── Fetches data using lib/server/home-data.ts utilities
└── Renders ComponentPreviewClient (Client Component)
    └── Handles interactivity (state, forms, Recoil)
```

### Example: Battle Logs Widget

```typescript
// BattleLogsHomePreview.tsx (Server Component)
export async function BattleLogsHomePreview({ userId }: Props) {
  // Fetch data server-side in parallel
  const [userData, battleLogs] = await Promise.all([
    fetchUserDataServer(userId),
    fetchBattleLogsServer(userId, 0, 4),
  ]);

  return (
    <BattleLogsHomePreviewClient
      userId={userId}
      userData={userData}
      initialLogs={battleLogs}
    />
  );
}
```

```typescript
// BattleLogsHomePreviewClient.tsx (Client Component)
'use client';

export function BattleLogsHomePreviewClient({ userData, initialLogs }: Props) {
  // Client-side interactivity, Recoil state, etc.
  return (
    <div>
      <BattleLogsByDayPreview battleLogs={initialLogs} />
      <AddBattleLogInput userData={userData} />
    </div>
  );
}
```

### Benefits

- **Instant Loading**: No skeletons or loading states - data arrives with the HTML
- **Self-Contained**: Each widget can be placed on any page
- **Parallel Fetching**: Each widget fetches its data independently
- **Simple Pages**: Pages just compose widgets without data coordination

### Available Widgets

| Widget | Server Component | Client Component |
|--------|------------------|------------------|
| Battle Logs | `BattleLogsHomePreview` | `BattleLogsHomePreviewClient` |
| Tournaments | `TournamentsHomePreview` | `TournamentsHomePreviewClient` |
| Pocket Games | `PocketHomePreview` | `PocketHomePreviewClient` |
| Pocket Tournaments | `PocketTournamentsHomePreview` | `PocketTournamentsHomePreviewClient` |

## Server-Side Data Fetching

All server-side fetch functions are in `lib/server/home-data.ts`:

```typescript
// Available server fetch functions
fetchUserDataServer(userId)
fetchBattleLogsServer(userId, page, daysPerPage)
fetchTournamentsServer(userId)
fetchTournamentRoundsServer(userId)
fetchPocketGamesServer(userId)
fetchPocketTournamentsServer(userId)
fetchPocketTournamentRoundsServer(userId)
```

These use the **server Supabase client** which reads cookies from the request.

## Client-Side Fetching (For Interactive Features)

For subsequent data fetching (pagination, real-time updates), components use SWR hooks:

```typescript
// hooks/logs/usePaginatedLogsByDay.ts
export function usePaginatedLogsByDay(userId: string, page: number) {
  const { data, isLoading } = useSWR(
    ['logs-by-day', userId, page],
    () => fetchPaginatedLogsByDistinctDays(userId, page)
  );
  return { data, isLoading };
}
```

### Hybrid Pattern

Components can accept server-fetched initial data AND support client-side refreshing:

```typescript
interface Props {
  initialGames?: PocketGame[];  // Server-fetched
}

export function PocketMatchesList({ initialGames }: Props) {
  // Skip SWR if initial data provided
  const { data: swrGames } = usePocketGames(initialGames ? undefined : userId);
  const games = initialGames ?? swrGames;
}
```

## State Management

### Recoil (Global Client State)

Used for state that needs to be shared across components:

```typescript
// app/recoil/atoms/battle-logs.ts
export const battleLogsAtom = atom<BattleLog[]>({
  key: 'battleLogs',
  default: [],
});
```

### SWR (Server State Cache)

Used for caching server data with automatic revalidation:

- Cache key format: `['resource', userId, ...params]`
- Automatic revalidation on window focus
- Manual invalidation via `mutate()`

## Authentication Flow

1. User signs in via `/login` (Supabase Auth)
2. Middleware (`middleware.ts`) refreshes session on each request
3. Server components use `fetchCurrentUser()` to check auth
4. Protected pages redirect to `/` if not authenticated

```typescript
// Server Component
const user = await fetchCurrentUser();
if (!user) return redirect('/');
```

## Database Schema (Key Tables)

- `user data` - User profiles and preferences
- `logs` - PTCG battle logs
- `tournaments` - PTCG tournaments
- `tournament rounds` - Tournament round results
- `pocket_games` - Pokemon Pocket matches
- `pocket_tournaments` - Pocket tournaments
- `pocket_tournament_rounds` - Pocket tournament rounds

## Adding New Features

### Adding a New Widget

1. Create server fetch function in `lib/server/home-data.ts`
2. Create client component `ComponentClient.tsx` with `'use client'`
3. Create server component `Component.tsx` that:
   - Fetches data using server utilities
   - Renders the client component with data as props
4. Add widget to the page

### Example: Adding a Stats Widget

```typescript
// 1. Add fetch function (lib/server/home-data.ts)
export async function fetchStatsServer(userId: string) {
  const supabase = createClient();
  const { data } = await supabase.from('stats').select('*').eq('user', userId);
  return data || [];
}

// 2. Create client component (components/stats/StatsPreviewClient.tsx)
'use client';
export function StatsPreviewClient({ stats }: { stats: Stat[] }) {
  // Interactive UI
}

// 3. Create server component (components/stats/StatsPreview.tsx)
export async function StatsPreview({ userId }: { userId: string }) {
  const stats = await fetchStatsServer(userId);
  return <StatsPreviewClient stats={stats} />;
}

// 4. Use in page
<StatsPreview userId={user.id} />
```
