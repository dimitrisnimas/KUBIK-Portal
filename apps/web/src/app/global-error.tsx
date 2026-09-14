"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="el"><body><main className="center-state" role="alert">
    <span className="eyebrow">KUBIK PORTAL DEMO</span>
    <h1>Παρουσιάστηκε προσωρινό πρόβλημα</h1>
    <p>Η εφαρμογή δεν μπόρεσε να ολοκληρώσει τη φόρτωση.</p>
    <button className="primary-button state-link" onClick={reset}>Νέα προσπάθεια</button>
  </main></body></html>;
}
