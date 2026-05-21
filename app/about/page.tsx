import { TranslatedText } from "@/components/general-translation/TranslatedText";
import { Header } from "@/components/ui/header";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'About',
};

export default async function About() {

  return (
    <div className="flex-1 flex flex-col w-full h-full p-8 sm:max-w-2xl gap-4">
      <Header>
        <TranslatedText id="about.header">About</TranslatedText>
      </Header>
      <p>
        <TranslatedText id="about.paragraph1">
          Training Court was made to consolidate all of your tournaments and practice rounds
          for the Pokemon Trading Card Game. It was made to be as easy-to-use and accessible
          as possible, with the player at the forefront of design.
        </TranslatedText>
      </p>
      <p>
        <TranslatedText id="about.paragraph2">
          You can import logs from PTCG Live, and see turns displayed in a beautiful format
          that&apos;s miles better than the wall of text the battle log gives you. Visualizing
          the game like this will help with understanding mistakes made in practice, and
          help in future matches. In the future, expect analytics capabilities to analyze
          your practice for you!
        </TranslatedText>
      </p>
      <p>
        <TranslatedText id="about.paragraph3">
          You can also track tournaments you play in, including what decks you play against and
          individual game records for each round. This information persists to your user account,
          so you&apos;ll always be able to go back and see the games you&apos;ve played in.
        </TranslatedText>
      </p>
      <p>
        <TranslatedText id="about.paragraph4">
          Special thanks to JW Kriewall for helping a ton with development. Hope you all enjoy the app!
        </TranslatedText>
      </p>
      <p>
        - Jared
      </p>
    </div>
  );
}
