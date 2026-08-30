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
import { Fragment, useMemo } from "react";
import { useToast } from "../ui/use-toast";
import Link from "next/link";
import { T, useGT } from "gt-react";
import useSWR from "swr";
import { createClient } from "@/utils/supabase/client";
import { parseBattleLog } from "@/components/battle-logs/utils/battle-log.utils";
import { useUiRefresh } from "@/hooks/useUiRefresh";
import {
  formatPlayerVsLabel,
  matchShareableRoute,
  resolveNamedCrumbLabel,
  shouldShowShareIcon,
} from "./header-breadcrumbs.utils";
import { Database } from "@/database.types";

function BreadcrumbLabel({ label }: { label: string }) {
  switch (label) {
    case 'Home':
      return <T id="breadcrumbs.home">Home</T>;
    case 'Pocket':
      return <T id="breadcrumbs.pocket">Pocket</T>;
    case 'Tournaments':
      return <T id="breadcrumbs.tournaments">Tournaments</T>;
    case 'Login':
      return <T id="breadcrumbs.login">Login</T>;
    case 'PTCG':
      return <T id="breadcrumbs.ptcg">PTCG</T>;
    case 'Logs':
      return <T id="breadcrumbs.logs">Logs</T>;
    case 'Stats':
      return <T id="breadcrumbs.stats">Stats</T>;
    default:
      return <>{label}</>;
  }
}

export default function HeaderBreadcrumbs() {
  const pathname = usePathname();
  const { toast } = useToast();
  const gt = useGT();
  const { enabled: uiRefresh } = useUiRefresh();
  const shareable = useMemo(() => matchShareableRoute(pathname), [pathname]);

  const { data: tournament } = useSWR(
    uiRefresh && shareable?.type === 'tournament'
      ? [shareable.table, shareable.id]
      : null,
    async () => {
      if (!shareable || shareable.type !== 'tournament') return null;
      const supabase = createClient();
      const { data } = await supabase
        .from(shareable.table)
        .select('*')
        .eq('id', shareable.id)
        .maybeSingle();
      return (data as Database['public']['Tables']['tournaments']['Row'] | null) ?? null;
    }
  );

  const { data: logData } = useSWR(
    uiRefresh && shareable?.type === 'log' ? ['log', shareable.id] : null,
    async () => {
      if (!shareable || shareable.type !== 'log') return null;
      const supabase = createClient();
      const { data } = await supabase
        .from('logs')
        .select()
        .eq('id', shareable.id)
        .returns<Database['public']['Tables']['logs']['Row'][]>()
        .maybeSingle();
      return data ?? null;
    }
  );

  const playerVs = useMemo(() => {
    if (!logData) return null;
    try {
      const battleLog = parseBattleLog(
        logData.log,
        logData.id,
        logData.created_at,
        logData.archetype,
        logData.opp_archetype,
        null,
        logData.format
      );
      return formatPlayerVsLabel(battleLog.players[0]?.name, battleLog.players[1]?.name);
    } catch {
      return null;
    }
  }, [logData]);

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
            label: maybeDeckId === 'new' ? 'New' : maybeDeckId,
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
        label: resolveNamedCrumbLabel({
          uiRefresh,
          rawLabel: pathname.split('/')[pathname.split('/').length - 1],
          playerVs,
        })
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
        label: resolveNamedCrumbLabel({
          uiRefresh,
          rawLabel: pathname.split('/')[pathname.split('/').length - 1],
          tournamentName: tournament?.name,
        })
      });
    }

    if (pathname.includes('/ptcg/stats')) {
      breadcrumbs.push({
        path: '/ptcg/stats',
        label: 'Stats'
      });
    }

    return breadcrumbs.filter((crumb) => crumb.label);
  }, [pathname, playerVs, tournament?.name, uiRefresh]);

  if (pathname === '/') return null;

  return (
    <Breadcrumb className="hidden sm:block">
    <BreadcrumbList>
      {breadcrumbs.map(({ path, label }, idx) => (
        <Fragment key={`${path}-${label}`} >
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={path} className={
                idx === breadcrumbs.length - 1
                  ? "max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap"
                  : undefined
                  }>
                <BreadcrumbLabel label={label} />
              </Link>
            </BreadcrumbLink>
            {shouldShowShareIcon({
              uiRefresh,
              pathname,
              isLastCrumb: idx === breadcrumbs.length - 1,
              crumbPath: path,
              crumbLabel: label,
            }) && (
              <ShareIcon
                onClick={() => {
                  navigator.clipboard.writeText('https://trainingcourt.app' + pathname);
                  toast({ title: gt("Copied sharable link to clipboard!", { $id: "breadcrumbs.shareCopied" }) });
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
