# Μοντέλο πρώτου vertical slice

Το v1 χρησιμοποιεί έναν feature-oriented modular monolith. Κάθε επαληθευμένη συνεδρία δημιουργεί νέο `DemoWorkspace` και όλα τα δεδομένα του portal φέρουν `workspace_id`. Τα EF Core global query filters εφαρμόζουν τον χώρο εργασίας σε κάθε ερώτημα, ενώ τα foreign keys με cascade διαγράφουν ολόκληρο το προσωρινό σύνολο στη λήξη ή την αποσύνδεση.

Το `ManagedAsset.AssetType` και το `ServiceCategory` παραμένουν χωριστές έννοιες. Το πρώτο περιγράφει το είδος του διαχειριζόμενου στοιχείου και το δεύτερο οργανώνει τον κατάλογο υπηρεσιών. Ένα asset έχει μηδέν ή ένα `ServicePackage`. Δεν υπάρχει οντότητα subscription ή ιστορικό προγράμματος στο v1.

Η συνεδρία περιλαμβάνει μόνο αναγνωριστικά για το `DemoSession`, το workspace και την επιλεγμένη προσομοιωμένη persona μέσα σε κρυπτογραφημένο HTTP-only cookie. Κάθε authenticated request ελέγχει τη server-side εγγραφή και την ημερομηνία λήξης πριν ορίσει το workspace scope.

Τα attachments είναι εκτός v1. Μελλοντικά μπορούν να προστεθούν ως ξεχωριστή οντότητα μηνύματος ticket και να αποθηκεύονται σε private object storage με εξουσιοδοτημένο upload/download, όρια μεγέθους, allow-list τύπων, ασφαλή generated keys, resource authorization, scanning και διαγραφή μαζί με το workspace.
