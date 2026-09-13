"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { DemoRole, Session } from "@/lib/types";

type Challenge = { challengeId: string; expiresAt: string; developmentCode?: string };

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<DemoRole>("Client");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestCode(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      setChallenge(await api<Challenge>("/auth/request-code", { method: "POST", body: JSON.stringify({ email, role }) }));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Παρουσιάστηκε σφάλμα."); }
    finally { setBusy(false); }
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault(); if (!challenge) return; setBusy(true); setError("");
    try {
      await api<Session>("/auth/verify-code", { method: "POST", body: JSON.stringify({ challengeId: challenge.challengeId, code }) });
      router.push("/portal"); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Παρουσιάστηκε σφάλμα."); }
    finally { setBusy(false); }
  }

  return (
    <main className="login-page">
      <section className="login-brand" aria-label="KUBIK Portal Demo">
        <div className="brand brand-light"><span className="brand-mark">K</span><span>KUBIK</span></div>
        <div className="brand-copy">
          <span className="eyebrow eyebrow-light">PORTAL DEMO</span>
          <h1>Η συνεργασία σας,<br />σε μία καθαρή εικόνα.</h1>
          <p>Περιηγηθείτε σε ένα ρεαλιστικό περιβάλλον πελάτη ή διαχειριστή ψηφιακού agency.</p>
        </div>
        <p className="demo-note">Τα δεδομένα είναι δοκιμαστικά και διαγράφονται αυτόματα όταν λήξει η συνεδρία.</p>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <span className="eyebrow">ΠΡΟΣΒΑΣΗ ΣΤΟ DEMO</span>
          <h2>{challenge ? "Ελέγξτε το email σας" : "Καλώς ήρθατε"}</h2>
          <p className="muted">{challenge ? `Στείλαμε έναν εξαψήφιο κωδικό στο ${email}.` : "Επιλέξτε τη δοκιμαστική εμπειρία που θέλετε να δείτε."}</p>

          {!challenge ? (
            <form onSubmit={requestCode}>
              <fieldset className="role-grid">
                <legend className="field-label">Δοκιμαστικός ρόλος</legend>
                <RoleCard active={role === "Client"} title="Demo Πελάτη" detail="Τα έργα, τα πακέτα και η συνολική εικόνα ενός πελάτη." onClick={() => setRole("Client")} />
                <RoleCard active={role === "Administrator"} title="Demo Διαχειριστή" detail="Η συνολική λειτουργική εικόνα του demo workspace." onClick={() => setRole("Administrator")} />
              </fieldset>
              <label className="field-label" htmlFor="email">Email</label>
              <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required />
              <button className="primary-button" disabled={busy}>{busy ? "Αποστολή…" : "Αποστολή κωδικού"}<span aria-hidden>→</span></button>
            </form>
          ) : (
            <form onSubmit={verifyCode}>
              <label className="field-label" htmlFor="code">Κωδικός επαλήθευσης</label>
              <input id="code" className="otp-input" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" required />
              {challenge.developmentCode && <p className="dev-code">Τοπικός κωδικός: <strong>{challenge.developmentCode}</strong></p>}
              <button className="primary-button" disabled={busy || code.length !== 6}>{busy ? "Έλεγχος…" : "Είσοδος στο demo"}<span aria-hidden>→</span></button>
              <button className="text-button" type="button" onClick={() => { setChallenge(null); setCode(""); }}>Αλλαγή email ή ρόλου</button>
            </form>
          )}
          {error && <p className="error-message" role="alert">{error}</p>}
          <p className="privacy-copy">Δεν δημιουργείται λογαριασμός. Το email χρησιμοποιείται μόνο για την επαλήθευση αυτής της συνεδρίας.</p>
        </div>
      </section>
    </main>
  );
}

function RoleCard({ active, title, detail, onClick }: { active: boolean; title: string; detail: string; onClick: () => void }) {
  return <button type="button" className={`role-card ${active ? "active" : ""}`} aria-pressed={active} onClick={onClick}>
    <span className="role-radio" aria-hidden>{active ? "✓" : ""}</span><span><strong>{title}</strong><small>{detail}</small></span>
  </button>;
}
