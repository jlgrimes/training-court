"use client";

import Link from "next/link";
import { SubmitButton } from "../forgot-password/submit-button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useState, useRef, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface AuthFormProps {
  signIn: (formData: FormData) => Promise<void>;
  signUp: (formData: FormData) => Promise<void>;
}

const gameOptions = [
  { value: "tcg", label: "Trading Card Game" },
  { value: "video", label: "Video Game" },
  { value: "pocket", label: "Pocket" },
];

export function AuthForm({ signIn, signUp }: AuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const toggleGame = (game: string) => {
    setSelectedGames(prev => 
      prev.includes(game) 
        ? prev.filter(g => g !== game)
        : [...prev, game]
    );
  };

  const removeGame = (game: string) => {
    setSelectedGames(prev => prev.filter(g => g !== game));
  };

  const getSelectedGamesLabel = () => {
    if (selectedGames.length === 0) return "Select games...";
    const labels = selectedGames.map(game => 
      gameOptions.find(g => g.value === game)?.label || game
    );
    return labels.join(", ");
  };

  return (
    <form className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
      <Label className="text-md" htmlFor="email">
        Email
      </Label>
      <Input
        className="rounded-md px-4 py-2 bg-inherit border mb-6"
        name="email"
        placeholder="you@example.com"
        required
      />
      <Label className="text-md" htmlFor="password">
        Password
      </Label>
      <Input
        className="rounded-md px-4 py-2 bg-inherit border mb-6"
        type="password"
        name="password"
        placeholder="••••••••"
        required
      />

      {isSignUp && (
        <div className="mb-6">
          <Label className="text-md mb-3 block">
            Select games for Training Court
          </Label>
          <div className="relative" ref={dropdownRef}>
            <div
              className="flex items-center justify-between rounded-md border px-3 py-2 cursor-pointer hover:bg-accent/50 transition-colors min-h-[40px]"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="text-sm truncate flex-1 mr-2">
                {getSelectedGamesLabel()}
              </span>
              <svg
                className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {isDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg">
                {gameOptions.map((game) => (
                  <div
                    key={game.value}
                    className="flex items-center px-3 py-2 hover:bg-accent cursor-pointer"
                    onClick={() => toggleGame(game.value)}
                  >
                    <input
                      type="checkbox"
                      name="games"
                      value={game.value}
                      checked={selectedGames.includes(game.value)}
                      onChange={() => {}}
                      className="mr-2"
                    />
                    <span className="text-sm">{game.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden inputs to pass selected games data */}
      {selectedGames.map((game) => (
        <input key={game} type="hidden" name="games" value={game} />
      ))}

      <SubmitButton
        formAction={isSignUp ? signUp : signIn}
        pendingText={isSignUp ? "Signing Up..." : "Signing In..."}
      >
        {isSignUp ? "Sign Up" : "Sign In"}
      </SubmitButton>

      {!isSignUp && (
        <p className="mt-4 text-sm text-center">
          Forgot your password?{" "}
          <Link href="/forgot-password" className="text-blue-500 underline">
            Reset Password
          </Link>
        </p>
      )}

      <div className="mt-6 pt-6 border-t">
        <div className="flex items-center justify-center space-x-3">
          <span className="text-sm text-muted-foreground">Sign In</span>
          <Switch
            checked={isSignUp}
            onCheckedChange={setIsSignUp}
            className="data-[state=checked]:bg-primary"
          />
          <span className="text-sm text-muted-foreground">Sign Up</span>
        </div>
      </div>
    </form>
  );
}