"use client";

import { useEffect, useRef, useState } from "react";

type AdSenseSlotProps = {
  slot?: string;
  className?: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  responsive?: boolean;
  minHeight?: number;
};

const isProduction = process.env.NODE_ENV === "production";
const ADS_PREF_KEY = "ads:hidden";
const ADS_PREF_EVENT = "ads:preference-change";

export function AdSenseSlot({
  slot,
  className,
  format = "auto",
  responsive = true,
  minHeight = 60,
}: AdSenseSlotProps) {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
  const hasRendered = useRef(false);
  const isReady = Boolean(publisherId && slot);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const updatePreference = () => {
      try {
        const stored = window.localStorage.getItem(ADS_PREF_KEY);
        setIsHidden(stored === "true");
      } catch {
        setIsHidden(false);
      }
    };

    updatePreference();
    window.addEventListener("storage", updatePreference);
    window.addEventListener(ADS_PREF_EVENT, updatePreference);

    return () => {
      window.removeEventListener("storage", updatePreference);
      window.removeEventListener(ADS_PREF_EVENT, updatePreference);
    };
  }, []);

  useEffect(() => {
    if (!isReady || hasRendered.current) {
      return;
    }

    try {
      const adsbygoogle = (window as any).adsbygoogle || [];
      (window as any).adsbygoogle = adsbygoogle;
      adsbygoogle.push({});
      hasRendered.current = true;
    } catch (error) {
      if (!isProduction) {
        // eslint-disable-next-line no-console
        console.warn("AdSense render failed", error);
      }
    }
  }, [isReady]);

  if (isHidden) {
    return null;
  }

  if (!isReady) {
    if (isProduction) {
      return null;
    }

    return (
      <div
        className={`flex items-center justify-center rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 text-[10px] uppercase tracking-wide text-muted-foreground ${className ?? ""}`}
        style={{ minHeight }}
      >
        Advertisement
      </div>
    );
  }

  return (
    <ins
      className={`adsbygoogle block ${className ?? ""}`}
      style={{ minHeight }}
      data-ad-client={publisherId}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  );
}
