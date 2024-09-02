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
import { useMemo } from "react";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";

export default function HeaderBreadcrumbs() {
  const pathname = usePathname();
  const { toast } = useToast();

  const breadcrumbs: { path: string, label: string}[] = useMemo(() => {
    const breadcrumbs = [{
      path: '/',
      label: 'Home'
    }];

    if (pathname.includes('live-log')) {
      breadcrumbs.push({
        path: '/home',
        label: 'Logs'
      }),
      breadcrumbs.push({
        path: pathname,
        label: pathname.split('/')[pathname.split('/').length - 1]
      });
    } else if (pathname.includes('tournament')) {
      breadcrumbs.push({
        path: '/home',
        label: 'Tournaments'
      }),
      breadcrumbs.push({
        path: pathname,
        label: pathname.split('/')[pathname.split('/').length - 1]
      });
    }

    return breadcrumbs;
  }, [pathname]);

  if (!pathname.includes('profile') && !pathname.includes('tournament') && !pathname.includes('live-log')) {
    return null;
  }

  return (
    <Breadcrumb className="my-2 ml-4 px-4">
    <BreadcrumbList>
      {breadcrumbs.map(({ path, label }, idx) => (
        <>
          <BreadcrumbItem>
            <BreadcrumbLink href={path}>{label}</BreadcrumbLink>
            {idx === 2 && <ShareIcon onClick={() => {
              navigator.clipboard.writeText('https://buddypoffin.com' + pathname);
              toast({
                title: "Copied sharable link to clipboard!",
              })
            }} className="mr-2 mb-1 h-4 w-4 cursor-pointer hover:stroke-slate-900" />}
          </BreadcrumbItem>
          {(idx < breadcrumbs.length - 1) && <BreadcrumbSeparator />}
        </>
      ))}
    </BreadcrumbList>
  </Breadcrumb>
  );
}
