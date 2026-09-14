# KUBIK Portal Demo

Δημόσιο portfolio/demo εφαρμογής client portal για ψηφιακό agency. Η νέα υλοποίηση χρησιμοποιεί ASP.NET Core 10, EF Core, PostgreSQL και Next.js 16. Κάθε επαληθευμένη είσοδος δημιουργεί νέο απομονωμένο workspace με deterministic seed data, το οποίο διαγράφεται στην αποσύνδεση ή στη λήξη της συνεδρίας.

Η τρέχουσα υλοποίηση καλύπτει OTP πρόσβαση, client/administrator demo personas, role-aware dashboard, διαχείριση έργων και πλήρη κατάλογο categories/packages. Οι client mutations περιορίζονται στα έργα της τρέχουσας persona και οι αλλαγές καταλόγου απαιτούν administrator role και CSRF token.

## Δομή

- `apps/api`: feature-oriented ASP.NET Core API και PostgreSQL migrations.
- `apps/web`: Greek-only Next.js App Router frontend.
- `apps/api/tests`: integration tests με πραγματικό PostgreSQL μέσω Testcontainers.
- `legacy`: η προηγούμενη εφαρμογή και η εγκεκριμένη ανάλυση ως υλικό αναφοράς.
- `docs`: συνοπτικές αποφάσεις της νέας αρχιτεκτονικής.

## Τοπική εκτέλεση

Απαιτούνται .NET 10, Node.js 22+, npm και Docker.

1. Εκκινήστε PostgreSQL με `docker compose up -d postgres`.
2. Εκκινήστε το API με `dotnet run --project apps/api/src/KubikPortal.Api`.
3. Αντιγράψτε το `apps/web/.env.example` σε `apps/web/.env.local`.
4. Εκτελέστε `npm install --prefix apps/web` και `npm run dev:web`.

Στο Development το API μπορεί να επιστρέφει τον OTP στη φόρμα όταν `Demo__RevealOtpInDevelopment=true`. Η τιμή παραγωγής πρέπει να είναι `false` και απαιτείται SMTP configuration. OTPs, email περιεχόμενο και credentials δεν καταγράφονται.

## Έλεγχοι

```text
dotnet build KubikPortal.slnx --configuration Release
dotnet test KubikPortal.slnx --configuration Release
npm run lint:web
npm run build:web
```

Τα integration tests χρησιμοποιούν Testcontainers και χρειάζονται διαθέσιμο Docker daemon.

## Παραγωγή

Το backend αναπτύσσεται στο Render από το `render.yaml` και το frontend στο Vercel με root directory `apps/web`. Στο Vercel ορίστε `API_ORIGIN` στο origin του Render service. Το `next.config.ts` προωθεί το browser `/api/*` στο backend, ώστε το authentication cookie να παραμένει same-origin. Δεν υπάρχει staging environment.

Το `Demo__Enabled=true` είναι απαραίτητο για την επιλογή προσομοιωμένης persona. Τα SMTP secrets ορίζονται αποκλειστικά ως environment variables. Δεν υπάρχουν analytics tags, object storage ή εξωτερικές παραγωγικές συνδέσεις KUBIK.
