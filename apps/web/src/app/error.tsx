"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="center-state" role="alert">
    <span className="eyebrow">ΠΡΟΣΩΡΙΝΟ ΠΡΟΒΛΗΜΑ</span>
    <h1>Η σελίδα δεν φορτώθηκε</h1>
    <p>Δοκιμάστε ξανά. Αν η demo συνεδρία έχει λήξει, επιστρέψτε στην είσοδο.</p>
    <button className="primary-button state-link" onClick={reset}>Νέα προσπάθεια</button>
  </main>;
}
