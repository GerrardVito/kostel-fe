# Kostel Frontend

React single-page app for the Kostel rental-management platform.

## Stack
- React 19 + Vite 6
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- `lucide-react` icons, `motion` animations
- Plain `fetch` for API calls (no global store)

## Architecture
See [`kostel-be/docs/architecture.md`](../kostel-be/docs/architecture.md) for the full system view.
In short:
- This repo is the SPA only — **no Node/Express server**.
- Built output (`dist/`) is served by Nginx in production.
- The API lives in `kostel-be` (NestJS on port 4000).
- In dev, Vite proxies `/api` and `/uploads` to `http://localhost:4000`
  (see `vite.config.ts`).

## Development
```bash
npm install
npm run dev      # starts Vite on http://localhost:4008
npm run build    # production build → dist/
npm run preview  # preview the production build locally
```
The dev server expects the NestJS API to be running on `http://localhost:4000`.

## Project layout
```
src/
├── main.tsx            # ReactDOM root
├── App.tsx             # top-level shell + routing
├── index.css           # Tailwind + theme tokens
├── types.ts            # shared TS types
├── initialData.ts      # dev/demo seed helpers
├── services/
│   └── auth.ts         # auth API helpers
├── pages/
│   └── LandingPage.tsx # public landing page (route: "/")
└── components/
    ├── landing/        # 12 landing page section components
    │   ├── Header.tsx
    │   ├── Hero.tsx
    │   ├── ProblemSection.tsx
    │   ├── FeatureTabs.tsx
    │   ├── HowItWorks.tsx
    │   ├── FinanceSection.tsx
    │   ├── BenefitsSection.tsx
    │   ├── Testimonials.tsx
    │   ├── Pricing.tsx
    │   ├── FAQ.tsx
    │   ├── CTABand.tsx
    │   └── Footer.tsx
    └── ~38 screen components (Owner*, Tenant*, Onboarding,
        Inspections, Checklist, Deposit, Maintenance, …)
```

## Deployment
Production build is consumed by Nginx (configured in `kostel-be/deploy/nginx.conf`).
See `docs/DEPLOY.md` for legacy deploy notes and `docs/nginx-spa.conf` for
an SPA-only nginx reference.