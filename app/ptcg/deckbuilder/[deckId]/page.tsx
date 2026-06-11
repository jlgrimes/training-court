import { Metadata } from 'next';
import { DeckbuilderPageClient } from '../DeckbuilderPageClient';

export const metadata: Metadata = {
  title: 'Deckbuilder',
};

type DeckbuilderDeckPageProps = {
  params: {
    deckId: string;
  };
};

export default function DeckbuilderDeckPage({ params }: DeckbuilderDeckPageProps) {
  return <DeckbuilderPageClient deckId={params.deckId} />;
}
