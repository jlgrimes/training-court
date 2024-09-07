import { EditableTournamentArchetype } from "@/components/archetype/AddArchetype/AddTournamentArchetype";
import { BattleLogPreview } from "@/components/battle-logs/BattleLogDisplay/BattleLogPreview";
import TournamentPreview from "@/components/tournaments/Preview/TournamentPreview";
import TournamentRoundList from "@/components/tournaments/TournamentRoundList";
import { displayTournamentDate } from "@/components/tournaments/utils/tournaments.utils";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle, SmallCardHeader } from "@/components/ui/card";

const mockJWToronto = {
  id: 'toronto',
  name: 'Toronto Regionals',
  created_at: '',
  date_from: '2024-10-27',
  date_to: '2024-10-29',
  deck : 'miraidon',
  user: ''
}

export default async function Index() {
  return (
    <div className="flex-1 w-full flex flex-col gap-24 items-center p-8 sm:p-12 max-w-6xl">
      <div className="flex flex-col items-center gap-8 max-w-md py-8">
        <h1 className="font-semibold text-4xl tracking-tight">Training Court</h1>
        <p className="text-center">Once during each player’s turn, that player may put a basic Energy card from their discard pile into their hand.</p>
        <Button disabled size='lg'>Coming soon</Button>
      </div>
      <div className="grid md:grid-cols-2 items-center gap-8 md:gap-16">
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-2xl">Battle Logs</h2>
          <p>
            Display your PTCG Live battle logs in a beautiful UI -
            all you have to do is Copy Paste. Training court gives you 
            a preview of each of your battles - all can be sorted by deck or day.
            Additionally, you can interact with a turn-by-turn breakdown of your battles, 
            including prize maps and other key actions each turn.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <BattleLogPreview battleLog={{
            id: '',
            players: [{
              name: 'jgrimesey',
              deck: 'chien-pao',
              result: 'W'
            }, {
              name: 'flexdaddy',
              deck: 'charizard',
              result: 'L'
            }],
            date: '2024-09-06 21:12:35.529016+00',
            winner: 'jgrimesey',
            sections: []
          }} currentUserScreenName='jgrimesey' />
          <BattleLogPreview battleLog={{
            id: '',
            players: [{
              name: 'jgrimesey',
              deck: 'chien-pao',
              result: 'L'
            }, {
              name: 'flexdaddy',
              deck: 'regidrago',
              result: 'W'
            }],
            date: '2024-09-06 21:12:35.529016+00',
            winner: 'flexdaddy',
            sections: []
          }} currentUserScreenName='jgrimesey' />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-2xl">Tournaments</h2>
          <p>
            Keep full record of your IRL Pokemon tournaments - from league cups, 
            to regionals, to international championships. Share tournament runs with your
            friends so they can keep up with the action at home.
          </p>
        </div>
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
                user: ''
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
            user: 'JW'
          },{
            id: '',
            created_at: '',
            deck: 'lugia',
            round_num: 17,
            match_end_reason: null,
            result: ['W', 'W'],
            tournament: '',
            user: 'JW'
          }, {
            id: '',
            created_at: '',
            deck: 'gardevoir',
            round_num: 18,
            match_end_reason: null,
            result: ['W', 'W'],
            tournament: '',
            user: 'JW'
          }]}
          updateClientRoundsOnEdit={async () => {'use server'}}
        />
        </div>
      </div>
      <div>
        <CardDescription>Made by Jared Grimes and JW Kriewall</CardDescription>
      </div>
    </div>
  );
}
