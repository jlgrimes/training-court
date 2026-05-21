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
  }, [pathname]);

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
                <BreadcrumbLabel label={label} />
              </Link>
            </BreadcrumbLink>
            {idx === breadcrumbs.length - 1 && /\d/.test(pathname) && (
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
