import { Metadata } from 'next';
import { DeckbuilderPageClient } from './DeckbuilderPageClient';

export const metadata: Metadata = {
  title: 'Deckbuilder',
};

export default function DeckbuilderPage() {
  return <DeckbuilderPageClient />;
}
