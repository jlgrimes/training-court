'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GameSelector } from "@/components/ui/game-selector";
import { useFormStatus } from 'react-dom';

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Creating account...' : children}
    </Button>
  );
}

interface SignUpFormProps {
  signUpAction: (formData: FormData) => Promise<void>;
}

export function SignUpForm({ signUpAction }: SignUpFormProps) {
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  
  const handleSubmit = async (formData: FormData) => {
    // Add selected games to form data
    formData.set('games', JSON.stringify(selectedGames));
    await signUpAction(formData);
  };
  
  return (
    <form action={handleSubmit} className="flex flex-col w-full gap-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          className="mt-1"
        />
      </div>
      
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          className="mt-1"
        />
      </div>
      
      <div>
        <Label htmlFor="games">Which games will you use Training Court for?</Label>
        <p className="text-sm text-muted-foreground mb-2">
          You can change this later in your preferences
        </p>
        <GameSelector
          selectedGames={selectedGames}
          onGamesChange={setSelectedGames}
          placeholder="Select at least one game..."
          className="mt-1"
        />
        {selectedGames.length === 0 && (
          <p className="text-sm text-red-500 mt-1">Please select at least one game</p>
        )}
      </div>
      
      <SubmitButton>
        Create Account
      </SubmitButton>
      
      <p className="text-xs text-center text-muted-foreground mt-4">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline">
          Privacy Policy
        </Link>
      </p>
    </form>
  );
}