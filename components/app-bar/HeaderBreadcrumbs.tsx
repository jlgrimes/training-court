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

export default function HeaderBreadcrumbs() {
  const pathname = usePathname();
  const { toast } = useToast();

  const breadcrumbs: { path: string, label: string}[] = useMemo(() => {
    const crumbs = [{
      path: '/home',
      label: 'Home'
    }];

    // Handle pocket tournaments explicitly to avoid mixing with the generic tournaments crumb
    if (pathname.startsWith('/pocket/tournaments/')) {
      const segments = pathname.split('/').filter(Boolean);
      const id = segments[segments.length - 1];
      crumbs.push({ path: '/pocket', label: 'Pocket' });
      crumbs.push({ path: '/pocket/tournaments', label: 'Tournaments' });
      crumbs.push({ path: pathname, label: id });
      return crumbs;
    }

    if (pathname.includes('/pocket')) {
      crumbs.push({
        path: '/pocket',
        label: 'Pocket'
      });
    }

    if (pathname.includes('/login')) {
      crumbs.push({
        path: '/login',
        label: 'Login'
      });
    }

    if (pathname.includes('/logs')) {
      crumbs.push({
        path: '/logs',
        label: 'Logs'
      });
    }

    if (pathname.includes('logs/')) {
      crumbs.push({
        path: pathname,
        label: pathname.split('/')[pathname.split('/').length - 1]
      });
    }

    if (pathname.includes('/tournaments')) {
      crumbs.push({
        path: '/tournaments',
        label: 'Tournaments'
      });
    }
    
    if (pathname.includes('tournaments/')) {
      crumbs.push({
        path: pathname,
        label: pathname.split('/')[pathname.split('/').length - 1]
      });
    }

    if (pathname.includes('/stats')) {
      crumbs.push({
        path: '/stats',
        label: 'Stats'
      });
    }

    return crumbs;
  }, [pathname]);

  if (pathname === '/') return null;

  const shouldShowShare =
    breadcrumbs.length > 1 &&
    (pathname.includes('tournaments/') ||
      pathname.includes('logs/') ||
      pathname.includes('pocket/tournaments/') ||
      pathname.includes('pocket/games/'));

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
            {shouldShowShare && idx === breadcrumbs.length - 1 && (
              <ShareIcon
                onClick={() => {
                  navigator.clipboard.writeText('https://trainingcourt.app' + pathname);
                  toast({
                    title: "Copied sharable link to clipboard!",
                  });
                }}
                className="ml-2 mb-1 h-4 w-4 cursor-pointer hover:stroke-slate-900 inline-block"
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
