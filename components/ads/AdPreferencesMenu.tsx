"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ADS_PREF_KEY = "ads:hidden";
const ADS_PREF_EVENT = "ads:preference-change";

export function AdPreferencesMenu() {
  const [adsHidden, setAdsHidden] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(ADS_PREF_KEY);
      setAdsHidden(stored === "true");
    } catch {
      setAdsHidden(false);
    }
  }, []);

  const toggleAds = () => {
    const nextValue = !adsHidden;
    setAdsHidden(nextValue);

    try {
      window.localStorage.setItem(ADS_PREF_KEY, nextValue ? "true" : "false");
      window.dispatchEvent(new Event(ADS_PREF_EVENT));
    } catch {
      // Ignore storage errors; UI state still reflects the current preference.
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          Ads
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            toggleAds();
          }}
        >
          {adsHidden ? "Show ads" : "Hide ads"}
          {adsHidden ? <Check className="ml-2 h-4 w-4" /> : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
