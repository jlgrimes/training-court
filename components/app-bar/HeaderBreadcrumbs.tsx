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
    const breadcrumbs = [{
      path: '/home',
      label: 'Home'
    }];

    if (pathname.includes('/pocket')) {
      breadcrumbs.push({
        path: '/pocket',
        label: 'Pocket'
      });
    }

    if (pathname.includes('/login')) {
      breadcrumbs.push({
        path: '/login',
        label: 'Login'
      });
    }

    if (pathname.includes('/logs')) {
      breadcrumbs.push({
        path: '/logs',
        label: 'Logs'
      });
    }

    if (pathname.includes('logs/')) {
      breadcrumbs.push({
        path: pathname,
        label: pathname.split('/')[pathname.split('/').length - 1]
      });
    }

    if (pathname.includes('/tournaments')) {
      breadcrumbs.push({
        path: '/tournaments',
        label: 'Tournaments'
      });
    }
    
    if (pathname.includes('tournaments/')) {
      breadcrumbs.push({
        path: pathname,
        label: pathname.split('/')[pathname.split('/').length - 1]
      });
    }

    if (pathname.includes('/stats')) {
      breadcrumbs.push({
        path: '/stats',
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
                {label}
              </Link>
            </BreadcrumbLink>
            {idx === 2 && <ShareIcon onClick={() => {
              navigator.clipboard.writeText('https://trainingcourt.app' + pathname);
              toast({
                title: "Copied sharable link to clipboard!",
              })
            }} className="mr-2 mb-1 h-4 w-4 cursor-pointer hover:stroke-slate-900" />}
          </BreadcrumbItem>
          {(idx < breadcrumbs.length - 1) && <BreadcrumbSeparator />}
        </Fragment>
      ))}
    </BreadcrumbList>
  </Breadcrumb>
  );
}
