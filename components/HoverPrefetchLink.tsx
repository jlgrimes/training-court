'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";
import type { ComponentProps } from "react";

// Link alone only prefetches dynamic pages up to their loading.tsx. Fetch the whole page on
// hover/touch so the click is usually served from cache. Not prefetch={true}: that would query
// the database for every link in view.
export function HoverPrefetchLink({ href, ...props }: ComponentProps<typeof Link> & { href: string }) {
  const router = useRouter();
  const prefetch = () => router.prefetch(href, { kind: PrefetchKind.FULL });

  return <Link href={href} {...props} onMouseEnter={prefetch} onTouchStart={prefetch} />;
}
