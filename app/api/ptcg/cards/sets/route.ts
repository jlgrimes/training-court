import { getDeckbuilderSets } from '@/lib/server/ptcg-card-catalog';

export async function GET() {
  try {
    const sets = await getDeckbuilderSets();
    return Response.json({ sets, code: 200 });
  } catch (error) {
    console.error('Failed to load deckbuilder sets:', error);
    return Response.json({ message: 'Failed to load sets', code: 500 }, { status: 500 });
  }
}
