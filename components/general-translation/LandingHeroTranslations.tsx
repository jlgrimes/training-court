'use client';

import { T } from 'gt-react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LandingHeroTranslations() {
  return (
    <>
      <T id="landing.tagline">
        <p className="text-center">
          Don&apos;t lose track of a game of Pokemon ever again. From PTCG Live
          testing phases to Regional Championships, Training Court has your
          back.
        </p>
      </T>
      <Link href="login">
        <Button size="lg">
          <T id="landing.getStarted">Get started</T>
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </>
  );
}
