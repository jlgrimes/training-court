import { getAllDeckbuilderCards, type DeckbuilderCatalogCard } from '@/lib/server/ptcg-card-catalog';

type ImportCardLine = {
  qty: number;
  name: string;
  setCode?: string;
  number?: string;
};

type ImportDeckEntry = {
  id: string;
  localId: string;
  name: string;
  imageUrlHiRes?: string;
  imageUrl?: string;
  category: string;
  qty: number;
  metadata: DeckbuilderCatalogCard['metadata'];
};

const basicEnergyNames = new Set([
  'grass',
  'fire',
  'water',
  'lightning',
  'psychic',
  'fighting',
  'darkness',
  'metal',
  'fairy',
]);

const normalize = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, "'")
    .replace(/\s+prism star\b/g, ' {*} ')
    .replace(/\bprism star\b/g, '{*}')
    .replace(/\s*-\s*(gx|ex|v|vmax|vstar)\b/g, ' $1')
    .replace(/\s+/g, ' ');

const normalizeCardNumber = (value: string): string => {
  const trimmed = value.trim().toLowerCase();
  const match = trimmed.match(/^0*(\d+)([a-z]*)$/);
  return match ? `${match[1]}${match[2]}` : trimmed;
};

const decodeHtmlEntities = (value: string): string =>
  value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

const buildIndex = (cards: DeckbuilderCatalogCard[]) => {
  const bySetNumber = new Map<string, DeckbuilderCatalogCard>();
  const byPtcgoSetNumber = new Map<string, DeckbuilderCatalogCard>();
  const byName = new Map<string, DeckbuilderCatalogCard[]>();

  cards.forEach((card) => {
    const setId = card.metadata.setId?.toLowerCase();
    const setCode = card.metadata.setCode?.toLowerCase();
    const number = card.metadata.number ? normalizeCardNumber(card.metadata.number) : undefined;
    if (setId && number) {
      bySetNumber.set(`${setId}|${number}`, card);
    }
    if (setCode && number) {
      byPtcgoSetNumber.set(`${setCode}|${number}`, card);
    }

    const key = normalize(card.name);
    const existing = byName.get(key) ?? [];
    existing.push(card);
    byName.set(key, existing);
  });

  return { bySetNumber, byPtcgoSetNumber, byName };
};

const parseDecklist = (text: string): ImportCardLine[] => {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const parsed: ImportCardLine[] = [];

  for (const line of lines) {
    if (/^(pok[eé]mon|pokemon|trainer|energy)\s*:/i.test(line)) {
      continue;
    }

    const match = line.match(/^(\d+)\s+(.+?)\s+([A-Za-z0-9-]+)\s+(\d+[A-Za-z0-9-]*)$/);
    if (!match) {
      continue;
    }

    const qty = Number(match[1]);
    let name = decodeHtmlEntities(match[2]?.trim() ?? '');
    let setCode: string | undefined = match[3]?.trim();
    const number = match[4]?.trim();

    if (setCode?.toLowerCase() === 'energy' && basicEnergyNames.has(name.toLowerCase())) {
      name = `${name} Energy`;
      setCode = undefined;
    }

    if (!qty || !name) {
      continue;
    }

    parsed.push({ qty, name, setCode, number });
  }

  return parsed;
};

const resolveCard = (
  line: ImportCardLine,
  index: ReturnType<typeof buildIndex>
): DeckbuilderCatalogCard | null => {
  const setCode = line.setCode?.toLowerCase();
  const number = line.number ? normalizeCardNumber(line.number) : undefined;

  if (setCode && number) {
    const direct = index.bySetNumber.get(`${setCode}|${number}`);
    if (direct) {
      return direct;
    }

    const byPtcgo = index.byPtcgoSetNumber.get(`${setCode}|${number}`);
    if (byPtcgo) {
      return byPtcgo;
    }
  }

  const candidates = index.byName.get(normalize(line.name)) ?? [];
  if (candidates.length === 0) {
    return null;
  }

  if (setCode) {
    const bySet = candidates.find(
      (card) =>
        card.metadata.setId?.toLowerCase() === setCode ||
        card.metadata.setCode?.toLowerCase() === setCode
    );
    if (bySet) {
      return bySet;
    }
  }

  return candidates[0];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { decklist?: string };
    const decklist = body?.decklist?.trim();

    if (!decklist) {
      return Response.json({ message: 'Missing decklist text.', code: 400 }, { status: 400 });
    }

    const lines = parseDecklist(decklist);
    if (lines.length === 0) {
      return Response.json({ message: 'No valid card lines found in decklist.', code: 400 }, { status: 400 });
    }

    const allCards = await getAllDeckbuilderCards();
    const index = buildIndex(allCards);

    const unresolved: string[] = [];
    const entriesMap = new Map<string, ImportDeckEntry>();

    for (const line of lines) {
      const card = resolveCard(line, index);
      if (!card) {
        unresolved.push(`${line.qty} ${line.name} ${line.setCode ?? ''} ${line.number ?? ''}`.trim());
        continue;
      }

      const existing = entriesMap.get(card.id);
      if (existing) {
        existing.qty += line.qty;
        continue;
      }

      entriesMap.set(card.id, {
        id: card.id,
        localId: card.localId,
        name: card.name,
        imageUrlHiRes: card.imageUrlHiRes,
        imageUrl: card.imageUrl,
        category: card.category,
        qty: line.qty,
        metadata: card.metadata,
      });
    }

    const entries = Array.from(entriesMap.values());
    const totalCards = entries.reduce((sum, entry) => sum + entry.qty, 0);

    if (entries.length === 0) {
      return Response.json(
        {
          message: 'No cards from this decklist matched the current catalog.',
          unresolved,
          parsedLines: lines.length,
          importedLines: 0,
          code: 400,
        },
        { status: 400 }
      );
    }

    return Response.json(
      {
        entries,
        totalCards,
        unresolved,
        parsedLines: lines.length,
        importedLines: lines.length - unresolved.length,
        code: 200,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to import decklist:', error);
    return Response.json({ message: 'Failed to import decklist.', code: 500 }, { status: 500 });
  }
}
