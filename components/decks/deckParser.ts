interface ParsedCard {
  name: string;
  setCode?: string;
  number?: string;
  count: number;
  section?: 'pokemon' | 'trainer' | 'energy';
}

interface CardData {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  number: string;
  set: {
    id: string;
    name: string;
    series: string;
  };
  images: {
    small: string;
    large: string;
  };
}

interface DeckCard {
  card: CardData;
  count: number;
}

// Parse deck list into structured data
export function parseDeckList(deckList: string): ParsedCard[] {
  const lines = deckList.trim().split('\n').filter(line => line.trim());
  const cards: ParsedCard[] = [];
  let currentSection: 'pokemon' | 'trainer' | 'energy' | '' = '';

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines and total cards line
    if (!trimmedLine || trimmedLine.toLowerCase().includes('total cards')) {
      continue;
    }

    // Check for section headers - looking for exact format "Pokemon:", "Trainer:", "Energy:"
    // Also handle variations with counts like "Pokemon: 13", "Pokémon: 13"
    if (trimmedLine.match(/^(Pokémon|Pokemon):\s*\d*$/i)) {
      currentSection = 'pokemon';
      continue;
    } else if (trimmedLine.match(/^Trainer:\s*\d*$/i)) {
      currentSection = 'trainer';
      continue;
    } else if (trimmedLine.match(/^Energy:\s*\d*$/i)) {
      currentSection = 'energy';
      continue;
    }

    // Parse card lines
    // Try to match patterns like:
    // 4 Pikachu BRS 52
    // 4 Professor's Research BRS 147
    // 4 Basic {L} Energy
    // 2 Basic Lightning Energy
    const match = trimmedLine.match(/^(\d+)\s+(.+)$/);
    if (match && currentSection) {
      const count = parseInt(match[1]);
      const cardInfo = match[2];
      
      // Try to extract set code and number
      // Pattern: Card Name SET 123
      const setMatch = cardInfo.match(/^(.+?)\s+([A-Z]{2,4})\s+(\d+)$/);
      if (setMatch) {
        cards.push({
          name: setMatch[1].trim(),
          setCode: setMatch[2],
          number: setMatch[3],
          count,
          section: currentSection,
        });
      } else {
        // No set info, just card name (common for basic energy)
        cards.push({
          name: cardInfo.trim(),
          count,
          section: currentSection,
        });
      }
    }
  }

  return cards;
}

// Cache for card data to avoid repeated API calls
const cardCache = new Map<string, CardData>();

// Fetch card data from Pokemon TCG API
export async function fetchCardData(
  parsedCards: ParsedCard[],
  onProgress?: (progress: number) => void
): Promise<DeckCard[]> {
  const cardsWithData: DeckCard[] = [];
  const cardsToFetch: { card: ParsedCard, index: number }[] = [];
  
  // First pass: handle basic energies and check cache
  parsedCards.forEach((parsedCard, index) => {
    // Handle basic energy cards immediately
    if (isBasicEnergy(parsedCard.name)) {
      cardsWithData[index] = {
        card: createBasicEnergyCard(parsedCard.name),
        count: parsedCard.count,
      };
      return;
    }

    // Check cache
    const cacheKey = `${parsedCard.name}-${parsedCard.setCode || ''}-${parsedCard.number || ''}`;
    const cached = cardCache.get(cacheKey);
    if (cached) {
      cardsWithData[index] = {
        card: cached,
        count: parsedCard.count,
      };
      return;
    }

    // Add to fetch list
    cardsToFetch.push({ card: parsedCard, index });
  });

  if (onProgress) {
    onProgress(Math.round(((parsedCards.length - cardsToFetch.length) / parsedCards.length) * 100));
  }

  // Batch fetch cards with set codes
  const cardsWithSetInfo = cardsToFetch.filter(({ card }) => card.setCode && card.number);
  const cardsWithoutSetInfo = cardsToFetch.filter(({ card }) => !card.setCode || !card.number);

  // Fetch cards with set info in parallel (these are usually quick exact matches)
  if (cardsWithSetInfo.length > 0) {
    const setCardPromises = cardsWithSetInfo.map(async ({ card, index }) => {
      try {
        const cardData = await searchCardBySetAndNumber(card.setCode!, card.number!);
        if (cardData) {
          const cacheKey = `${card.name}-${card.setCode}-${card.number}`;
          cardCache.set(cacheKey, cardData);
          cardsWithData[index] = { card: cardData, count: card.count };
        } else {
          cardsWithData[index] = { card: createPlaceholderCard(card), count: card.count };
        }
      } catch (error) {
        console.error(`Error fetching ${card.name}:`, error);
        cardsWithData[index] = { card: createPlaceholderCard(card), count: card.count };
      }
    });

    await Promise.all(setCardPromises);
  }

  // Fetch remaining cards by name (batch by supertype for efficiency)
  const pokemonCards = cardsWithoutSetInfo.filter(({ card }) => card.section === 'pokemon');
  const trainerCards = cardsWithoutSetInfo.filter(({ card }) => card.section === 'trainer');
  const energyCards = cardsWithoutSetInfo.filter(({ card }) => card.section === 'energy');

  const fetchByName = async (cards: typeof cardsWithoutSetInfo, supertype: string) => {
    const promises = cards.map(async ({ card, index }) => {
      try {
        const cardData = await searchCardByName(card.name, supertype, card.setCode);
        if (cardData) {
          const cacheKey = `${card.name}-${card.setCode || ''}-${card.number || ''}`;
          cardCache.set(cacheKey, cardData);
          cardsWithData[index] = { card: cardData, count: card.count };
        } else {
          cardsWithData[index] = { card: createPlaceholderCard(card), count: card.count };
        }
      } catch (error) {
        console.error(`Error fetching ${card.name}:`, error);
        cardsWithData[index] = { card: createPlaceholderCard(card), count: card.count };
      }
    });
    await Promise.all(promises);
  };

  // Fetch all card types in parallel
  await Promise.all([
    fetchByName(pokemonCards, 'Pokémon'),
    fetchByName(trainerCards, 'Trainer'),
    fetchByName(energyCards, 'Energy'),
  ]);

  if (onProgress) {
    onProgress(100);
  }

  // Sort by original order
  return cardsWithData.filter(Boolean);
}

// Search for a card by set and number (exact match)
async function searchCardBySetAndNumber(setCode: string, number: string): Promise<CardData | null> {
  const baseUrl = 'https://api.pokemontcg.io/v2/cards';
  
  try {
    const response = await fetch(
      `${baseUrl}?q=set.id:${setCode.toLowerCase()} number:${number}&pageSize=1`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        return data.data[0];
      }
    }
  } catch (error) {
    console.error('API error:', error);
  }

  return null;
}

// Search for a card by name
async function searchCardByName(name: string, supertype: string, setCode?: string): Promise<CardData | null> {
  const baseUrl = 'https://api.pokemontcg.io/v2/cards';
  
  try {
    const nameQuery = name.replace(/['"]/g, ''); // Remove quotes
    let query = `name:"${encodeURIComponent(nameQuery)}" supertype:${supertype}`;
    
    const response = await fetch(`${baseUrl}?q=${query}&pageSize=10`);

    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        // If we have set info, try to find the best match
        if (setCode) {
          const exactSetMatch = data.data.find(
            (card: CardData) => card.set.id === setCode.toLowerCase()
          );
          if (exactSetMatch) return exactSetMatch;
        }
        
        // Return the most recent printing (usually first result)
        return data.data[0];
      }
    }
  } catch (error) {
    console.error('API error:', error);
  }

  return null;
}

// Check if a card name is a basic energy
function isBasicEnergy(name: string): boolean {
  const lowerName = name.toLowerCase();
  const energyTypes = [
    'grass', 'fire', 'water', 'lightning', 'psychic', 
    'fighting', 'darkness', 'metal', 'fairy', 'colorless'
  ];
  
  // Check for patterns like "Basic {L} Energy" or "Basic Lightning Energy"
  if (lowerName.includes('basic') && lowerName.includes('energy')) {
    return true;
  }
  
  // Check for just energy type names
  return energyTypes.some(type => 
    lowerName === type || 
    lowerName === `${type} energy` ||
    lowerName.includes(`{${type[0]}}`)
  );
}

// Create a basic energy card object
function createBasicEnergyCard(name: string): CardData {
  const lowerName = name.toLowerCase();
  let energyType = 'colorless';
  
  // Extract energy type
  if (lowerName.includes('grass') || lowerName.includes('{g}')) energyType = 'grass';
  else if (lowerName.includes('fire') || lowerName.includes('{r}')) energyType = 'fire';
  else if (lowerName.includes('water') || lowerName.includes('{w}')) energyType = 'water';
  else if (lowerName.includes('lightning') || lowerName.includes('{l}')) energyType = 'lightning';
  else if (lowerName.includes('psychic') || lowerName.includes('{p}')) energyType = 'psychic';
  else if (lowerName.includes('fighting') || lowerName.includes('{f}')) energyType = 'fighting';
  else if (lowerName.includes('darkness') || lowerName.includes('{d}')) energyType = 'darkness';
  else if (lowerName.includes('metal') || lowerName.includes('{m}')) energyType = 'metal';
  else if (lowerName.includes('fairy') || lowerName.includes('{y}')) energyType = 'fairy';

  return {
    id: `basic-${energyType}-energy`,
    name: `Basic ${energyType.charAt(0).toUpperCase() + energyType.slice(1)} Energy`,
    supertype: 'Energy',
    subtypes: ['Basic'],
    number: '1',
    set: {
      id: 'energy',
      name: 'Basic Energy',
      series: 'Energy',
    },
    images: {
      small: `https://images.pokemontcg.io/sm1/164.png`, // Placeholder energy image
      large: `https://images.pokemontcg.io/sm1/164_hires.png`,
    },
  };
}

// Create a placeholder card when we can't find the actual card
function createPlaceholderCard(parsedCard: ParsedCard): CardData {
  // Determine supertype based on section
  let supertype = 'Unknown';
  if (parsedCard.section === 'pokemon') {
    supertype = 'Pokémon';
  } else if (parsedCard.section === 'trainer') {
    supertype = 'Trainer';
  } else if (parsedCard.section === 'energy') {
    supertype = 'Energy';
  }

  return {
    id: `placeholder-${parsedCard.name.toLowerCase().replace(/\s+/g, '-')}`,
    name: parsedCard.name,
    supertype,
    number: parsedCard.number || '0',
    set: {
      id: parsedCard.setCode?.toLowerCase() || 'unknown',
      name: parsedCard.setCode || 'Unknown Set',
      series: 'Unknown',
    },
    images: {
      small: 'https://via.placeholder.com/245x342?text=Card+Not+Found',
      large: 'https://via.placeholder.com/490x684?text=Card+Not+Found',
    },
  };
}