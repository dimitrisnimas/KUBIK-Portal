# Μοντέλο v1

Το v1 χρησιμοποιεί έναν feature-oriented modular monolith. Κάθε επαληθευμένη συνεδρία δημιουργεί νέο `DemoWorkspace` και όλα τα δεδομένα του portal φέρουν `workspace_id`. Τα EF Core global query filters εφαρμόζουν τον χώρο εργασίας σε κάθε ερώτημα, ενώ τα foreign keys με cascade διαγράφουν ολόκληρο το προσωρινό σύνολο στη λήξη ή την αποσύνδεση.

Το `ManagedAsset.AssetType` και το `ServiceCategory` παραμένουν χωριστές έννοιες. Το πρώτο περιγράφει το είδος του διαχειριζόμενου στοιχείου και το δεύτερο οργανώνει τον κατάλογο υπηρεσιών. Ένα asset έχει μηδέν ή ένα `ServicePackage`. Δεν υπάρχει οντότητα subscription ή ιστορικό προγράμματος στο v1.

Η συνεδρία περιλαμβάνει μόνο αναγνωριστικά για το `DemoSession`, το workspace και την επιλεγμένη προσομοιωμένη persona μέσα σε κρυπτογραφημένο HTTP-only cookie. Κάθε authenticated request ελέγχει τη server-side εγγραφή και την ημερομηνία λήξης πριν ορίσει το workspace scope.

Τα attachments είναι εκτός v1. Μελλοντικά μπορούν να προστεθούν ως ξεχωριστή οντότητα μηνύματος ticket και να αποθηκεύονται σε private object storage με εξουσιοδοτημένο upload/download, όρια μεγέθους, allow-list τύπων, ασφαλή generated keys, resource authorization, scanning και διαγραφή μαζί με το workspace.

Τα support/change requests μοντελοποιούνται ως `SupportTicket` και append-only `TicketMessage` εγγραφές. Ο client ορίζει μόνο τίτλο, τύπο, προτεραιότητα, σχετικό asset και περιγραφή. Η κατάσταση αλλάζει από administrator μέσα από ρητό transition table. Οι αποφάσεις κάλυψης ή χρέωσης αποθηκεύονται ως immutable `TicketBillingDecision` history με reviewer, timestamp, σημείωση και τιμή μόνο όταν η απόφαση είναι `Chargeable`. Δεν υπάρχουν attachment ή client billing fields στα request contracts.

Το `Invoice` είναι δομημένο παραστατικό με server-calculated γραμμές, καθαρή αξία, σταθερό ΦΠΑ 24% και τελικό σύνολο. Το PDF δεν αποθηκεύεται: δημιουργείται κατά απαίτηση από αυτά τα δεδομένα με embedded Noto Sans ώστε να αποδίδει σωστά τα ελληνικά, και επιστρέφεται μόνο μέσα από το εξουσιοδοτημένο invoice endpoint.

Η `PaymentDeclaration` είναι ελαφριά προσομοίωση χειροκίνητου ελέγχου τραπεζικής μεταφοράς. Ο client υποβάλλει μόνο αναφορά και προαιρετική σημείωση. Η εγγραφή ξεκινά ως `PendingReview` και ένα filtered unique database index επιτρέπει μόνο μία εκκρεμή δήλωση ανά τιμολόγιο. Ο administrator ορίζει `Approved` ή `Rejected`, reviewer, χρόνο και προαιρετική σημείωση. Μόνο η έγκριση αλλάζει το invoice από `Unpaid` σε `Paid`, και οι δύο αλλαγές γίνονται στην ίδια συναλλαγή.
