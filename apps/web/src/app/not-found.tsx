import Link from "next/link";

export default function NotFound() {
  return <main className="center-state"><span className="eyebrow">404</span><h1>Η σελίδα δεν βρέθηκε</h1><p>Η διεύθυνση που ανοίξατε δεν υπάρχει στο demo.</p><Link className="primary-button state-link" href="/">Επιστροφή στην αρχική</Link></main>;
}
