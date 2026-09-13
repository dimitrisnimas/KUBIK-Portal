"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Session } from "@/lib/types";

const SessionContext = createContext<Session | null>(null);
export const usePortalSession = () => {
  const value = useContext(SessionContext);
  if (!value) throw new Error("Το portal session δεν είναι διαθέσιμο.");
  return value;
};

export function PortalShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Session>("/session").then(setSession).catch(() => router.replace("/"));
  }, [router]);

  async function logout() {
    if (!session) return;
    try {
      await api<void>("/auth/logout", { method: "POST", headers: { "X-CSRF-TOKEN": session.csrfToken } });
      router.replace("/"); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Η αποσύνδεση απέτυχε."); }
  }

  if (!session) return <main className="center-state"><span className="spinner" /><p>Φόρτωση δοκιμαστικού χώρου…</p></main>;
  const isAdmin = session.role === "Administrator";
  const links = [{ href: "/portal", label: "Επισκόπηση", icon: "grid" }, { href: "/portal/assets", label: "Υπηρεσίες & έργα", icon: "briefcase" }];

  return <SessionContext.Provider value={session}>
    <div className="portal-frame">
      <button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Άνοιγμα μενού">☰</button>
      {menuOpen && <button className="menu-backdrop" onClick={() => setMenuOpen(false)} aria-label="Κλείσιμο μενού" />}
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <Link className="brand" href="/portal"><span className="brand-mark">K</span><span>KUBIK</span></Link>
          <span className="persona-badge">{isAdmin ? "Demo Διαχειριστή" : "Demo Πελάτη"}</span>
        </div>
        <nav aria-label="Κύρια πλοήγηση">
          <p className="nav-label">ΧΩΡΟΣ ΕΡΓΑΣΙΑΣ</p>
          {links.map((link) => {
            const active = link.href === "/portal" ? pathname === link.href : pathname.startsWith(link.href);
            return <Link key={link.href} href={link.href} className={`nav-link ${active ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
              <Icon name={link.icon} />{link.label}
            </Link>;
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="avatar">{session.displayName.charAt(0)}</div>
          <div className="identity"><strong>{session.displayName}</strong><span>{session.email}</span></div>
          <button className="icon-button" onClick={logout} title="Αποσύνδεση" aria-label="Αποσύνδεση"><Icon name="logout" /></button>
        </div>
      </aside>
      <main className="portal-main">
        <div className="demo-banner"><span>●</span> Προβάλλετε προσομοιωμένο περιβάλλον {isAdmin ? "διαχειριστή" : "πελάτη"}. Τα δεδομένα είναι προσωρινά.</div>
        {error && <p className="error-message" role="alert">{error}</p>}
        {children}
      </main>
    </div>
  </SessionContext.Provider>;
}

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/></>,
  };
  return <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{paths[name]}</svg>;
}
