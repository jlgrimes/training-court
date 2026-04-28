'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ShareIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useToast } from "../ui/use-toast";
import Link from "next/link";

const SAVED_DECKS_STORAGE_KEY = 'ptcg-deckbuilder-saved-v1';

type SavedDeckPreview = {
  id: string;
  name: string;
};

export default function HeaderBreadcrumbs() {
  const pathname = usePathname();
  const { toast } = useToast();
  const [deckBreadcrumbLabel, setDeckBreadcrumbLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!pathname.includes('/ptcg/deckbuilder/')) {
      setDeckBreadcrumbLabel(null);
      return;
    }

    const pathParts = pathname.split('/').filter(Boolean);
    const deckId = pathParts[2];
    if (!deckId || deckId === 'new') {
      setDeckBreadcrumbLabel(deckId === 'new' ? 'New' : null);
      return;
    }

    try {
      const raw = localStorage.getItem(SAVED_DECKS_STORAGE_KEY);
      if (!raw) {
        setDeckBreadcrumbLabel(deckId);
        return;
      }

      const parsed = JSON.parse(raw) as SavedDeckPreview[];
      if (!Array.isArray(parsed)) {
        setDeckBreadcrumbLabel(deckId);
        return;
      }

      const exactMatches = parsed.filter((deck) => deck.id === deckId);
      if (exactMatches.length === 0) {
        setDeckBreadcrumbLabel(deckId);
        return;
      }

      const target = exactMatches[0];
      const sameNameCount = parsed.filter((deck) => deck.name?.trim().toLowerCase() === target.name?.trim().toLowerCase()).length;
      setDeckBreadcrumbLabel(sameNameCount === 1 ? target.name : deckId);
    } catch {
      setDeckBreadcrumbLabel(deckId);
    }
  }, [pathname]);

  const breadcrumbs: { path: string, label: string}[] = useMemo(() => {
    const breadcrumbs = [{
      path: '/home',
      label: 'Home'
    }];

    if (pathname.includes('/pocket')) {
      breadcrumbs.push({
        path: '/pocket',
        label: 'Pocket'
      });
      if (pathname.includes('/pocket/tournaments')) {
        breadcrumbs.push({
          path: '/pocket/tournaments',
          label: 'Tournaments',
        });
      }
    }

    if (pathname.includes('/login')) {
      breadcrumbs.push({
        path: '/login',
        label: 'Login'
      });
    }

    if (pathname.includes('/ptcg')) {
      breadcrumbs.push({
        path: '/ptcg/logs',
        label: 'PTCG'
      });
      if (pathname.includes('/ptcg/deckbuilder')) {
        breadcrumbs.push({
          path: '/ptcg/deckbuilder',
          label: 'Deckbuilder',
        });
        const deckbuilderPathParts = pathname.split('/').filter(Boolean);
        const maybeDeckId = deckbuilderPathParts[2];
        if (maybeDeckId) {
          breadcrumbs.push({
            path: `/ptcg/deckbuilder/${maybeDeckId}`,
            label: maybeDeckId === 'new' ? 'New' : (deckBreadcrumbLabel ?? maybeDeckId),
          });
        }
      }
      if (pathname.includes('/ptcg/logs')) {
        breadcrumbs.push({
          path: '/ptcg/logs',
          label: 'Logs'
        });
      }
    }

    if (pathname.includes('logs/')) {
      breadcrumbs.push({
        path: pathname,
        label: pathname.split('/')[pathname.split('/').length - 1]
      });
    }

    if (pathname.includes('/ptcg/tournaments')) {
      breadcrumbs.push({
        path: '/ptcg/tournaments',
        label: 'Tournaments'
      });
    }
    
    if (pathname.includes('tournaments/')) {
      breadcrumbs.push({
        path: pathname,
        label: pathname.split('/')[pathname.split('/').length - 1]
      });
    }

    if (pathname.includes('/ptcg/stats')) {
      breadcrumbs.push({
        path: '/ptcg/stats',
        label: 'Stats'
      });
    }

    return breadcrumbs;
  }, [deckBreadcrumbLabel, pathname]);

  if (pathname === '/') return null;

  return (
    <Breadcrumb className="hidden sm:block">
    <BreadcrumbList>
      {breadcrumbs.map(({ path, label }, idx) => (
        <Fragment key={path} >
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={path} className={
                idx === breadcrumbs.length - 1
                  ? "max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap"
                  : undefined
                  }>
                {label}
              </Link>
            </BreadcrumbLink>
            {idx === breadcrumbs.length - 1 && /\d/.test(pathname) && (
              <ShareIcon
                onClick={() => {
                  navigator.clipboard.writeText('https://trainingcourt.app' + pathname);
                  toast({ title: "Copied sharable link to clipboard!" });
                }}
                className="mr-2 mb-1 h-4 w-4 cursor-pointer hover:stroke-slate-900"
              />
            )}
          </BreadcrumbItem>
          {(idx < breadcrumbs.length - 1) && <BreadcrumbSeparator />}
        </Fragment>
      ))}
    </BreadcrumbList>
  </Breadcrumb>
  );
}
