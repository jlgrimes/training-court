'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EditableTournamentArchetype } from "@/components/archetype/AddArchetype/AddTournamentArchetype";
import { fetchCurrentUserClient } from "@/components/auth.client.utils";
import { BattleLogPreview } from "@/components/battle-logs/BattleLogDisplay/BattleLogPreview";
import TournamentRoundList from "@/components/tournaments/TournamentRoundList";
import { displayTournamentDate } from "@/components/tournaments/utils/tournaments.utils";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle, SmallCardHeader } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const mockJWToronto = {
  id: 'toronto',
  name: 'Toronto Regionals',
  created_at: '',
  date_from: '2023-10-27',
  date_to: '2023-10-29',
  deck : 'miraidon',
  user: '',
  category: null,
  placement: null,
  format: null
}

export default function Index() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const currentUser = await fetchCurrentUserClient();
      if (currentUser) {
        router.push('/home');
      } else {
        setIsLoading(false);
      }
    }
    checkUser();
  }, [router]);

  if (isLoading) {
    return <div className="flex-1 w-full flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-24 items-center p-8 sm:p-12 max-w-6xl">
      <div className="flex flex-col items-center gap-6 max-w-md py-8">
        <Image src={'/logo.png'} alt='logo' width={240} height={30} />
        <p className="text-center">Don't lose track of a game of Pokemon ever again. From PTCG Live testing phases to Regional Championships, Training Court has your back.</p>
        <Link href={'login'}><Button size='lg'>Get started <ArrowRight className="h-4 w-4 ml-2" /></Button></Link>
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
                user: '',
                category: null,
                placement: null,
                format: null
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
            id: 'round-16',
            created_at: '',
            deck: 'goodra',
            round_num: 16,
            match_end_reason: null,
            result: ['W', 'W'],
            tournament: '',
            user: 'JW',
            turn_orders: []
          },{
            id: 'round-17',
            created_at: '',
            deck: 'lugia',
            round_num: 17,
            match_end_reason: null,
            result: ['W', 'W'],
            tournament: '',
            user: 'JW',
            turn_orders: []
          }, {
            id: 'round-18',
            created_at: '',
            deck: 'gardevoir',
            round_num: 18,
            match_end_reason: null,
            result: ['W', 'W'],
            tournament: '',
            user: 'JW',
            turn_orders: []
          }]}
          updateClientRoundsOnEdit={(newRound, pos) => {
            // Demo component - no actual updates needed
            console.log('Demo: Round update', newRound, pos);
          }}
        />
        </div>
      </div>
      <div>
        <CardDescription>Made by Jared Grimes and JW Kriewall</CardDescription>
      </div>
    </div>
  );
}
