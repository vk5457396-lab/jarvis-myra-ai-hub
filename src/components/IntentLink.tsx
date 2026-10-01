"use client";

import { forwardRef, type ComponentProps } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * <Link> that prefetches only when the user shows intent (hover, touch, keyboard focus) instead of
 * whenever it scrolls into view. The navbar and footer render ~20 links on every page, and the
 * default viewport prefetch fetched all of them on every page view — about half of all page
 * requests in production logs (2026-10-01) were these unused prefetches.
 */
const IntentLink = forwardRef<HTMLAnchorElement, ComponentProps<typeof Link>>(function IntentLink(
  { href, onMouseEnter, onTouchStart, onFocus, ...props },
  ref
) {
  const router = useRouter();
  const prefetch = () => {
    if (typeof href === "string" && href.startsWith("/") && !href.startsWith("//")) router.prefetch(href);
  };
  return (
    <Link
      ref={ref}
      href={href}
      prefetch={false}
      onMouseEnter={(e) => {
        prefetch();
        onMouseEnter?.(e);
      }}
      onTouchStart={(e) => {
        prefetch();
        onTouchStart?.(e);
      }}
      onFocus={(e) => {
        prefetch();
        onFocus?.(e);
      }}
      {...props}
    />
  );
});

export default IntentLink;
