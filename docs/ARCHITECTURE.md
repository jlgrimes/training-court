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

## Data Fetching Strategy

### Server-Side Fetching (Preferred for Initial Load)

For pages that need to load instantly without skeletons, we use server-side data fetching:

```typescript
// lib/server/home-data.ts
export async function fetchHomeDataServer(userId: string, options: {
  includePtcg: boolean;
  includePocket: boolean;
}) {
  // Fetch all data in parallel
  const results = await Promise.all([
    fetchUserDataServer(userId),
    options.includePtcg && fetchBattleLogsServer(userId),
    // ... more parallel fetches
  ]);
  return { userData, battleLogs, tournaments, ... };
}
```

The server component fetches data and passes it as props:

```typescript
// app/home/page.tsx (Server Component)
export default async function Home() {
  const user = await fetchCurrentUser();
  const data = await fetchHomeDataServer(user.id, { ... });

  return (
    <BattleLogsHomePreview
      userData={data.userData}
      battleLogs={data.battleLogs}
    />
  );
}
```

### Client-Side Fetching (For Interactive Features)

For subsequent data fetching (pagination, real-time updates), we use SWR:

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

Components can accept both server-fetched initial data AND support client-side refreshing:

```typescript
// Component accepts optional initial data
interface Props {
  initialGames?: PocketGame[];  // Server-fetched
}

export function PocketMatchesList({ initialGames }: Props) {
  // Skip SWR if initial data provided
  const { data: swrGames } = usePocketGames(initialGames ? undefined : userId);
  const games = initialGames ?? swrGames;
  // ...
}
```

## State Management

### Recoil (Global Client State)

Used for state that needs to be shared across components:

```typescript
// app/recoil/atoms/battleLogs.ts
export const userLogsAtom = atom<BattleLog[]>({
  key: 'userLogs',
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

## Performance Optimizations

### 1. Server-Side Data Fetching
- Home page fetches all data server-side in parallel
- No client-side loading states or skeletons
- Instant page render with full content

### 2. Parallel Queries
```typescript
const [userData, logs, tournaments] = await Promise.all([
  fetchUserDataServer(userId),
  fetchBattleLogsServer(userId),
  fetchTournamentsServer(userId),
]);
```

### 3. Conditional Fetching
Only fetch data for enabled games:
```typescript
if (options.includePtcg) {
  promises.push(fetchBattleLogsServer(userId));
}
```

### 4. SWR Caching
Client-side data is cached to prevent redundant fetches.

## Adding New Features

### Adding a New Data Type

1. Add server fetch function in `lib/server/home-data.ts`
2. Create SWR hook in `hooks/` for client-side use
3. Update component to accept both server and client data
4. Update page to fetch server-side if needed

### Adding a New Page

1. Create route in `app/[route]/page.tsx`
2. Fetch data server-side for instant loading
3. Pass data to client components as props
