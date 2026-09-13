"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AssetList } from "@/components/asset-list";
import { usePortalSession } from "@/components/portal-shell";
import { api, formatCurrency } from "@/lib/api";
import type { Dashboard } from "@/lib/types";

export default function DashboardPage() {
  const session = usePortalSession();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api<Dashboard>("/dashboard").then(setData).catch((reason) => setError(reason.message)); }, []);
  const firstName = session.displayName.split(" ")[0];

  return <div className="content-wrap">
    <header className="page-header"><div><span className="eyebrow">ΕΠΙΣΚΟΠΗΣΗ</span><h1>Καλημέρα, {firstName}</h1><p>Η συνολική εικόνα του δοκιμαστικού σας χώρου.</p></div><div className="header-date">{new Intl.DateTimeFormat("el-GR", { dateStyle: "long" }).format(new Date())}</div></header>
    {error && <p className="error-message" role="alert">{error}</p>}
    {!data ? <div className="panel loading-panel"><span className="spinner" /> Φόρτωση στοιχείων…</div> : <>
      <section className="stat-grid" aria-label="Βασικά στοιχεία">
        <StatCard tone="blue" label="Σύνολο έργων" value={data.assetCount.toString()} note="στο demo workspace" />
        <StatCard tone="green" label="Ενεργές υπηρεσίες" value={data.activeAssetCount.toString()} note="σε κανονική λειτουργία" />
        {session.role === "Administrator" && <StatCard tone="violet" label="Demo πελάτες" value={data.clientCount.toString()} note="ενεργές περσόνες" />}
        <StatCard tone="orange" label="Μηνιαία αξία" value={formatCurrency(data.monthlyTotal)} note="προσομοιωμένο σύνολο" />
      </section>
      <section className="panel">
        <div className="panel-header"><div><h2>Υπηρεσίες & έργα</h2><p>Τα πιο πρόσφατα ενεργά στοιχεία του χώρου.</p></div><Link href="/portal/assets">Προβολή όλων <span>→</span></Link></div>
        <AssetList assets={data.recentAssets} compact />
      </section>
    </>}
  </div>;
}

function StatCard({ tone, label, value, note }: { tone: string; label: string; value: string; note: string }) {
  return <article className={`stat-card stat-${tone}`}><span>{label}</span><strong>{value}</strong><small>{note}</small><i /></article>;
}
