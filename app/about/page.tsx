import { Header } from "@/components/ui/header";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'About',
};

export default async function About() {

  return (
    <div className="flex-1 flex flex-col w-full h-full p-8 sm:max-w-2xl gap-4">
      <Header>
        About
      </Header>
      <p>
        Training Court was made to consolidate all of your tournaments and practice rounds
        for the Pokémon Trading Card Game. It was made to be as easy-to-use and accessible
        as possible, with the player at the forefront of design.
      </p>
      <p>
        You can import logs from PTCG Live, and see turns displayed in a beautiful format
        that's miles better than the wall of text the battle log gives you. Visualizing
        the game like this will help with understanding mistakes made in practice, and
        help in future matches. In the future, expect analytics capabilities to analyze
        your practice for you!
      </p>
      <p>
        You can also track tournaments you play in, including what decks you play against and
        individual game records for each round. This information persists to your user account,
        so you'll always be able to go back and see the games you've played in.
      </p>
      <p>
        Special thanks to JW Kriewall for helping a ton with development. Hope you all enjoy the app!
      </p>
      <p>
        - Jared
      </p>
    </div>
  );
}
