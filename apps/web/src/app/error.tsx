"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="center-state"><span className="eyebrow">ΣΦΑΛΜΑ</span><h1>Κάτι δεν πήγε καλά</h1><p>Δοκιμάστε ξανά σε λίγα δευτερόλεπτα.</p><button className="primary-button state-link" onClick={reset}>Νέα προσπάθεια</button></main>;
}
