# AutoRent - Car Rental Management System

**نظام إدارة كراء السيارات** — A complete, production-ready car rental management application built with Next.js 16 and Firebase.

## Features

- **Dashboard** — Real-time statistics, alerts, and quick actions
- **Client Management** — Add, edit, search, and manage clients with CIN, driver license, and contact details
- **Fleet Management** — Full CRUD for vehicles with images, pricing tiers (day/week/month), insurance & inspection tracking
- **Contract Management** — Create, complete, and cancel rental contracts with detailed driver info, financial breakdown, and digital signatures
- **Payment Tracking** — Record payments, deposits, and returns with cash/card/transfer methods
- **Maintenance Scheduling** — Track repairs, oil changes, tires, and other maintenance with garage info and cost tracking
- **Expense Tracking** — Record fuel, repair, insurance, tax, and other vehicle expenses
- **Fleet View** — Real-time status of all vehicles (available, rented, maintenance, retired)
- **Loyalty Program** — Points-based client loyalty system with Bronze/Silver/Gold/Platinum levels
- **Activity Log** — Complete audit trail of all system actions
- **Reports & Charts** — Monthly revenue, payment trends, fleet status, and top clients
- **Multi-language** — Arabic and French with full RTL support
- **Dark Mode** — Light/dark theme toggle
- **Data Seeding** — Generate sample data for testing/demo

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Animations | Framer Motion |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Notifications | Sonner |
| Icons | Lucide React |

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project (free tier works)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd car-rental
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or use existing)
3. Enable **Authentication** → Sign-in method → Email/Password + Anonymous
4. Enable **Cloud Firestore** (start in test mode, then apply rules below)
5. Get your Firebase config from Project Settings → General → Your apps → Web app

### 3. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Firestore Security Rules

Deploy the rules from `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. (Optional) Seed Demo Data

Navigate to `/seed` and click the button to populate your database with sample clients, cars, contracts, and payments.

## Deployment

### Deploy to Vercel (Recommended)

1. Push the project to a GitHub repository
2. Go to [Vercel](https://vercel.com) and import your repo
3. Add the environment variables from `.env.local`
4. Deploy!

Your app will be live at `https://your-app.vercel.app`

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/          # Next.js App Router pages
│   ├── cars/     # Car management
│   ├── clients/  # Client management
│   ├── contracts/# Contract management
│   ├── payments/ # Payment tracking
│   ├── maintenance/ # Maintenance
│   ├── expenses/ # Expense tracking
│   ├── fleet/    # Fleet overview
│   ├── reports/  # Reports & charts
│   ├── loyalty/  # Loyalty program
│   ├── activity-log/ # Audit trail
│   ├── settings/ # System settings
│   ├── login/    # Login page
│   ├── register/ # Registration
│   └── seed/     # Demo data seeder
├── components/   # Reusable UI components
│   ├── layout/   # Layout, sidebar, theme, auth
│   └── ui/       # Button, Card, Table, Badge, etc.
├── lib/          # Utilities and config
│   ├── firebase.ts   # Firebase initialization
│   ├── firestore.ts  # Firestore CRUD helpers
│   ├── types.ts      # TypeScript interfaces
│   └── utils.ts      # Formatting helpers
└── services/     # Business logic services
```

## Use Case

This system is designed for **car rental agencies in Tunisia and North Africa**, with built-in support for:
- Tunisian CIN and driver license formats
- Tunisian Dinar (DT) currency
- Arabic and French languages
- Local contract requirements

## Screenshots

*(Add screenshots here – see the `screenshots/` directory after running the capture script)*

## License

MIT - See LICENSE file
