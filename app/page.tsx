import { EditableTournamentArchetype } from "@/components/archetype/AddArchetype/AddTournamentArchetype";
import { fetchCurrentUser } from "@/components/auth.utils";
import { BattleLogPreview } from "@/components/battle-logs/BattleLogDisplay/BattleLogPreview";
import LandingHeroTranslations from "@/components/general-translation/LandingHeroTranslations";
import {
  LandingBattleLogsCopy,
  LandingFooterCopy,
  LandingTournamentsCopy,
} from "@/components/general-translation/LandingPageCopy";
import TournamentRoundList from "@/components/tournaments/TournamentRoundList";
import { displayTournamentDate } from "@/components/tournaments/utils/tournaments.utils";
import { Card, CardDescription, CardTitle, SmallCardHeader } from "@/components/ui/card";
import Image from "next/image";
import { redirect } from "next/navigation";

const mockJWToronto = {
  id: 'toronto',
  name: 'Toronto Regionals',
  created_at: '',
  date_from: '2023-10-27',
  date_to: '2023-10-29',
  deck : 'miraidon',
  user: '',
  hat_type: null,
  category: null,
  placement: null,
  format: null,
  notes: null
}

export default async function Index() {
  const currentUser = await fetchCurrentUser();

  if (currentUser) {
    redirect('/home');
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-24 items-center p-8 sm:p-12 max-w-6xl">
      <div className="flex flex-col items-center gap-6 max-w-md py-8">
        <Image src={'/logo.png'} alt='logo' width={240} height={30} />
        <LandingHeroTranslations />
      </div>
      <div className="grid md:grid-cols-2 items-center gap-8 md:gap-16">
        <LandingBattleLogsCopy />
        <div className="flex flex-col gap-2">
          <BattleLogPreview battleLog={{
            id: '',
            players: [{
              name: 'jgrimesey',
              deck: 'chien-pao',
              oppDeck: 'charizard',
              result: 'W'
            }, {
              name: 'flexdaddy',
              deck: 'charizard',
              oppDeck: 'chien-pao',
              result: 'L'
            }],
            date: '2024-09-06 21:12:35.529016+00',
            winner: 'jgrimesey',
            sections: [],
            language: 'en'
          }} currentUserScreenName='jgrimesey' />
          <BattleLogPreview battleLog={{
            id: '',
            players: [{
              name: 'jgrimesey',
              deck: 'chien-pao',
              oppDeck: 'regidrago',
              result: 'L'
            }, {
              name: 'flexdaddy',
              deck: 'regidrago',
              oppDeck: 'chien-pao',
              result: 'W'
            }],
            date: '2024-09-06 21:12:35.529016+00',
            winner: 'flexdaddy',
            sections: [],
            language: 'en'
          }} currentUserScreenName='jgrimesey' />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
        <LandingTournamentsCopy />
        <div className="flex flex-col gap-2">
        <Card>
          <SmallCardHeader className="grid grid-cols-6 items-center">
            <div className="grid-cols-1">
              <EditableTournamentArchetype tournament={{
                id: 'toronto',
                name: 'Peoria Regionals',
                created_at: '',
                date_from: '2024-10-28',
                date_to: '2024-10-29',
                deck : 'miraidon',
                user: '',
                hat_type: '',
                category: null,
                placement: null,
                format: null,
                notes: null
              }} editDisabled />
            </div>
            <div className="col-span-4 grid-cols-5">
              <CardTitle>Peoria Regionals</CardTitle>
              <CardDescription className="grid gap-4">
                {displayTournamentDate('2024-10-07', '2024-10-08')}
              </CardDescription>
            </div>
            <CardTitle className="text-right">12-3-2</CardTitle>
          </SmallCardHeader>
        </Card>
        <Card className="mb-2">
          <SmallCardHeader className="grid grid-cols-6 items-center">
            <div className="grid-cols-1">
              <EditableTournamentArchetype tournament={mockJWToronto} editDisabled />
            </div>
            <div className="col-span-4 grid-cols-5">
              <CardTitle>Toronto Regionals</CardTitle>
              <CardDescription className="grid gap-4">
                {displayTournamentDate('2024-10-27', '2024-10-29')}
              </CardDescription>
            </div>
            <CardTitle className="text-right">14-2-2</CardTitle>
          </SmallCardHeader>
        </Card>
        <TournamentRoundList
          tournament={mockJWToronto}
          userId=''
          rounds={[{
            id: '',
            created_at: '',
            deck: 'goodra',
            round_num: 16,
            match_end_reason: null,
            result: ['W', 'W'],
            tournament: '',
            user: 'JW',
            turn_orders: []
          },{
            id: '',
            created_at: '',
            deck: 'lugia',
            round_num: 17,
            match_end_reason: null,
            result: ['W', 'W'],
            tournament: '',
            user: 'JW',
            turn_orders: []
          }, {
            id: '',
            created_at: '',
            deck: 'gardevoir',
            round_num: 18,
            match_end_reason: null,
            result: ['W', 'W'],
            tournament: '',
            user: 'JW',
            turn_orders: []
          }]}
          updateClientRoundsOnEdit={async () => {'use server'}}
        />
        </div>
      </div>
      <div>
        <LandingFooterCopy />
      </div>
    </div>
  );
}


