'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export default function HeaderBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs: { path: string, label: string}[] = useMemo(() => {
    const breadcrumbs = [{
      path: '/',
      label: 'Home'
    }];

    if (pathname.includes('live-log')) {
      breadcrumbs.push({
        path: '/profile',
        label: 'Logs'
      }),
      breadcrumbs.push({
        path: pathname,
        label: pathname.split('/')[pathname.split('/').length - 1]
      });
    } else if (pathname.includes('tournament')) {
      breadcrumbs.push({
        path: '/profile',
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
    <Breadcrumb className="my-2 ml-4">
    <BreadcrumbList>
      {breadcrumbs.map(({ path, label }, idx) => (
        <>
            <BreadcrumbItem>
            <BreadcrumbLink href={path}>{label}</BreadcrumbLink>
          </BreadcrumbItem>
          {(idx < breadcrumbs.length - 1) && <BreadcrumbSeparator />}
        </>
      ))}
    </BreadcrumbList>
  </Breadcrumb>
  );
}
