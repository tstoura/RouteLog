# RouteLog

**RouteLog** is a club-oriented mountain activity journal (Greek UI). This repository is a **frontend prototype**: landing, auth-style screens, activity recording forms (hiking, rock climbing, expedition), mock routes and history, and detail pages. There is **no real backend** or persistence yet.

## Requirements

- **Node.js** 20+ (or current LTS) recommended  
- **npm** (comes with Node)

## Run the project

```bash
# Install dependencies
npm install

# Start dev server (hot reload)
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

**Prototype admin UI:** on `/login`, enter **`admin`** as the username or email (password ignored) and submit to open **`/admin`**. Any other value goes to **`/app`**.

## Other commands

```bash
# Production build
npm run build

# Preview production build locally
npm run preview

# Lint
npm run lint
```

## Documentation

See **`DOCUMENTATION.md`** for screens, routing, mock data, reusable components (including **route detail UI flags**, **category-specific routes/history**, **history list sort** when **Όλες** + year filter, and **activity form tabs / rock combobox** behavior), user flows, and current limitations.

## Tech stack (short)

- React 19, TypeScript, Vite 6  
- React Router 7  
- Tailwind CSS 4  
