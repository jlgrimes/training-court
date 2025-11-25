import { Database } from '@/database.types';

export type PokemonTcgTournament = Database['public']['Tables']['tournaments']['Row'];
export type PokemonTcgTournamentRound = Database['public']['Tables']['tournament rounds']['Row'];

export type PocketTournament = Database['public']['Tables']['pocket_tournaments']['Row'];
export type PocketTournamentRound = Database['public']['Tables']['pocket_tournament_rounds']['Row'];

export type TournamentLike = PokemonTcgTournament | PocketTournament;
export type TournamentRoundLike = PokemonTcgTournamentRound | PocketTournamentRound;
