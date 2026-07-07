"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import LogoutButton from "@/app/components/LogoutButton";
import { parseEvalParam, buildQueryString } from "@/lib/eval-query";

type Session = { tipo: "super" | "escuela" | "zona"; cct?: string; zona?: number } | null;

const allLinks = [
  {
    href: "/",
    label: "Inicio",
    icon: (
      <svg className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/escuelas",
    label: "Escuelas",
    icon: (
      <svg className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
        <path d="M2 21h20" />
        <path d="M12 17v4" />
        <path d="M5 21V9l7-4 7 4v12" />
        <path d="M9 21v-4h6v4" />
      </svg>
    ),
  },
  {
    href: "/por-nivel",
    label: "Por nivel",
    icon: (
      <svg className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    href: "/reactivos",
    label: "Reactivos",
    icon: (
      <svg className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/recursos",
    label: "Recursos",
    icon: (
      <svg className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path d="M8 7h8" />
        <path d="M8 11h8" />
      </svg>
    ),
  },
];

function NavInner({ session }: { session?: Session }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (pathname === "/login") return null;

  const evalModo = parseEvalParam(searchParams.get("eval"));
  const zonas = searchParams
    .getAll("zona")
    .map((z) => parseInt(z, 10))
    .filter((n) => !isNaN(n) && n > 0);

  const hrefWithContext = (path: string) => {
    const qs = buildQueryString({ evalModo, zona: zonas });
    return `${path}${qs}`;
  };

  const links = session?.tipo === "escuela" ? allLinks.filter((l) => l.href !== "/escuelas") : allLinks;

  return (
    <nav className="app-nav">
      <div className="app-nav-glow" aria-hidden />
      <div className="app-nav-inner">
        {links.map(({ href, label, icon }) => {
          const target = hrefWithContext(href);
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={target}
              prefetch
              className={`nav-tab ${isActive ? "nav-tab--active" : "nav-tab--inactive"}`}
              aria-current={isActive ? "page" : undefined}
              aria-label={label}
            >
              <span className="nav-tab__icon">{icon}</span>
              <span className="nav-tab__label">{label}</span>
            </Link>
          );
        })}
        <div className="app-nav__logout nav-tab nav-tab--inactive">
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}

function NavFallback({ session }: { session?: Session }) {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  const links = session?.tipo === "escuela" ? allLinks.filter((l) => l.href !== "/escuelas") : allLinks;

  return (
    <nav className="app-nav">
      <div className="app-nav-glow" aria-hidden />
      <div className="app-nav-inner">
        {links.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            prefetch
            className={`nav-tab ${pathname === href ? "nav-tab--active" : "nav-tab--inactive"}`}
            aria-label={label}
          >
            <span className="nav-tab__icon">{icon}</span>
            <span className="nav-tab__label">{label}</span>
          </Link>
        ))}
        <div className="app-nav__logout nav-tab nav-tab--inactive">
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}

export default function Nav({ session }: { session?: Session }) {
  return (
    <Suspense fallback={<NavFallback session={session} />}>
      <NavInner session={session} />
    </Suspense>
  );
}
