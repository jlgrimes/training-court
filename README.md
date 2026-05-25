# Training Court

A battle log and tournament tracking application for Pokemon TCG and Pokemon Pocket players.

## Features

- **Battle Log Tracking**: Record and analyze your Pokemon TCG Live matches
- **Tournament Management**: Track tournament results, rounds, and placements
- **Pokemon Pocket Support**: Log Pokemon Pocket matches and tournaments
- **Statistics & Analytics**: View win rates, matchup data, and performance trends
- **Dark Mode**: Full dark mode support
- **Mobile Responsive**: Works on all devices

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org) (App Router)
- **Database**: [Supabase](https://supabase.com) (PostgreSQL)
- **Authentication**: Supabase Auth with SSR cookies
- **UI**: [Radix UI](https://radix-ui.com) + [Tailwind CSS](https://tailwindcss.com)
- **State Management**: [Recoil](https://recoiljs.org) + [SWR](https://swr.vercel.app)
- **Deployment**: [Vercel](https://vercel.com)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jlgrimes/training-court.git
   cd training-court
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

   Update `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

### Test Password Reset Locally

Password recovery uses a Supabase email token confirmation route at `/auth/confirm`. To exercise the flow while running the app locally:

1. Keep `.env.local` pointed at the Supabase project you want to test, and set:
   ```bash
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
2. In that Supabase project's Auth URL configuration, allow `http://localhost:3000/auth/callback`.
3. Start the app with `npm run dev`, request a reset from `/forgot-password`, and open the delivered email.
4. Enter and confirm a new password. The app signs out the recovery session and returns to login so the new password can be verified immediately.

For cross-device reset links, set the Supabase recovery email template link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`. For production, set `NEXT_PUBLIC_SITE_URL=https://trainingcourt.app` in the deployed app and configure the matching Supabase site URL and redirect URLs.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── home/              # Main dashboard
│   ├── ptcg/              # Pokemon TCG routes
│   ├── pocket/            # Pokemon Pocket routes
│   └── api/               # API routes
├── components/            # React components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities
│   └── server/            # Server-side utilities
└── docs/                  # Documentation
```

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.

### Key Patterns

- **Server-Side Data Fetching**: The home page fetches all data server-side for instant loading
- **Parallel Queries**: Multiple database queries run in parallel for performance
- **Hybrid Client/Server**: Components can receive server-fetched data while supporting client-side updates

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run test     # Run tests
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
