import { createClient } from '@/utils/supabase/server';
import { Header } from '@/components/ui/header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type PocketGame = {
  id: number;
  result: string;
  deck: string;
  opp_deck: string;
  created_at: string;
};

function countResults(games: PocketGame[]) {
  const wins = games.filter((g) => g.result?.toUpperCase() === 'W').length;
  const losses = games.filter((g) => g.result?.toUpperCase() === 'L').length;
  const draws = games.length - wins - losses;
  const total = games.length;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  return { wins, losses, draws, total, winRate };
}

export async function PocketStatsSummary({ userId }: { userId: string }) {
  const supabase = createClient();
  const { data: games } = await supabase
    .from('pocket_games')
    .select('*')
    .eq('user', userId)
    .order('created_at', { ascending: false })
    .returns<PocketGame[]>();

  const { wins, losses, draws, total, winRate } = countResults(games ?? []);

  return (
    <div className='flex flex-col gap-4'>
      <Header description='Your Pocket win/loss summary'>Pocket Stats</Header>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div>
            <p className='text-sm text-muted-foreground'>Games played</p>
            <p className='text-2xl font-semibold'>{total}</p>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>Wins</p>
            <p className='text-2xl font-semibold text-emerald-600'>{wins}</p>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>Losses</p>
            <p className='text-2xl font-semibold text-red-600'>{losses}</p>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>Win rate</p>
            <p className='text-2xl font-semibold'>{winRate}%</p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Recent games</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2 text-sm text-muted-foreground'>
          {games && games.length > 0 ? (
            games.slice(0, 8).map((game) => (
              <div key={game.id} className='flex justify-between'>
                <span className='truncate'>{game.deck} vs {game.opp_deck}</span>
                <span className='font-semibold'>{game.result}</span>
              </div>
            ))
          ) : (
            <p>No Pocket games yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
