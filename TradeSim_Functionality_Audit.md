# TradeSim — Full Functionality Audit

## Project Overview
**Stack:** React + Vite (frontend) | Express + Node.js (backend) | Clerk (auth) | MongoDB | Razorpay (payments) | Yahoo Finance + Binance APIs

---

## ✅ FULLY WORKING — No Changes Needed

| Feature | Location | Status |
|---|---|---|
| Landing page — all navigation links, scroll-to-section, footer social links | `Landing.jsx` | ✅ |
| Login page — Clerk `<SignIn>` form, social OAuth, redirects to `/dashboard` | `Login.jsx` | ✅ |
| Register page — Clerk `<SignUp>` form, redirects to `/dashboard` | `Register.jsx` | ✅ |
| Protected route guard (redirects to `/login` if not authenticated) | `ProtectedRoute.jsx` | ✅ |
| Sidebar navigation — all links to Dashboard, Markets, Heatmap, Portfolio, Watchlist, Wallet, Settings | `MainLayout.jsx` | ✅ |
| Mobile hamburger menu | `MainLayout.jsx` | ✅ |
| Notifications bell — dropdown opens/closes | `MainLayout.jsx` | ✅ |
| Market type toggle (Crypto / Stocks) — persists across pages via Context | `MarketContext.jsx` | ✅ |
| Watchlist — add/remove assets, persists to `localStorage` | `MarketContext.jsx` | ✅ |
| Markets page — fetches real crypto & stock data from backend, search, filter, sort | `Markets.jsx` | ✅ |
| Asset Drawer — opens detail view when clicking an asset row | `AssetDrawer.jsx` | ✅ |
| Heatmap page — renders market heatmap | `Heatmap.jsx` | ✅ |
| Trade page — chart with timeframes, layout switcher (1/2/4 panels), Asset Search modal | `Trade.jsx` | ✅ |
| Dashboard — live market data cards, news feed, refresh button | `Dashboard.jsx` | ✅ |
| Theme toggle (Light/Dark) — `Settings.jsx` → `ThemeContext` | `Settings.jsx` | ✅ |
| Notification checkboxes — Trade Confirmations, Security Alerts toggles | `Settings.jsx` | ✅ |
| Wallet "Add Funds" button → navigates to `/payment` with state | `Wallet.jsx` | ✅ |
| Payment page — Razorpay order creation UI, payment method display | `Payment.jsx` | ✅ |
| Trade "Buy Now" → navigates to `/payment` with order details | `Trade.jsx` | ✅ |
| Keyboard shortcut system (`useKeyboardShortcuts`) | `hooks/` | ✅ |
| Command Palette | `CommandPalette.jsx` | ✅ |
| Error Boundary fallback | `ErrorBoundary.jsx` | ✅ |
| Backend health check endpoint `/health` | `server.js` | ✅ |
| Backend API routes: `/api/stocks`, `/api/etfs`, `/api/crypto`, `/api/news` | `server.js` | ✅ |

---

## 🔴 BROKEN — Must Fix

### 1. `logout` function missing from `AuthContext`
**File:** `frontend/src/context/AuthContext.jsx`  
**Problem:** `MainLayout.jsx` calls `const { user, logout } = useAuth()`, but `AuthContext` never defines or exports a `logout` function. Clicking the **Log Out** button silently fails — the user stays logged in and is just redirected to `/login`.

**Fix — add to `AuthContext.jsx`:**
```jsx
import { useAuth as useClerkAuth, useUser, useClerk } from '@clerk/clerk-react';

// Inside AuthProvider:
const { signOut } = useClerk();
const logout = () => signOut();

// Add to authContextValue:
const authContextValue = {
  ...
  logout,
};
```

---

### 2. Frontend `.env.local` missing `VITE_BACKEND_URL`
**File:** `frontend/.env.local`  
**Problem:** The file only contains `VITE_CLERK_PUBLISHABLE_KEY`. The `api.js` config reads `import.meta.env.VITE_BACKEND_URL` — since it's missing, the backend URL silently falls back to `http://localhost:5000`. This works locally but **breaks in production** (deployed frontend can't reach `localhost:5000`).

**Fix — add to `frontend/.env.local`:**
```
VITE_BACKEND_URL=http://localhost:5000
```
And for production deployment, set:
```
VITE_BACKEND_URL=https://your-backend-domain.com
```

---

### 3. Razorpay keys missing from backend `.env`
**File:** `backend/.env`  
**Problem:** `paymentRoutes.js` reads `process.env.RAZORPAY_KEY_ID` and `process.env.RAZORPAY_KEY_SECRET`. Neither is set in the `.env` file — the code falls back to dummy values (`rzp_test_dummy` / `dummy_secret`). The **"Proceed to Pay"** button will throw a Razorpay API error.

**Fix — add to `backend/.env`:**
```
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET
```
Get these from your [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys).

---

### 4. Settings page uses hardcoded dummy user data
**File:** `frontend/src/pages/Settings.jsx`  
**Problem:** Profile section shows **"John Doe"** and **"john.doe@example.com"** hardcoded with `readOnly` inputs. The real logged-in user's name/email from Clerk is never displayed. "Change Avatar" button does nothing (no `onClick`). "Change Password" and "Two-Factor Authentication" buttons have no `onClick` handlers.

**Fix — wire up Clerk user data:**
```jsx
import { useAuth } from '../context/AuthContext';
// Inside component:
const { user } = useAuth();
// Replace hardcoded values:
<h3>{user?.name || 'Your Name'}</h3>
<p>{user?.email}</p>
// Avatar initials:
{user?.name?.charAt(0) || '?'}
// Inputs:
<input value={user?.name || ''} .../>
<input value={user?.email || ''} .../>
// Change Password / 2FA — open Clerk's UserProfile:
import { useClerk } from '@clerk/clerk-react';
const { openUserProfile } = useClerk();
<button onClick={() => openUserProfile()}>Change Password</button>
```

---

### 5. Wallet "Withdraw" button does nothing
**File:** `frontend/src/pages/Wallet.jsx`  
**Problem:** The **Withdraw** button has no `onClick` handler — it's purely decorative.

**Fix options:**
- Show a modal saying "Withdrawals are not supported in simulation mode"
- Or navigate to a withdraw flow if one is planned

```jsx
<button onClick={() => alert('Withdrawals are simulated — no real funds.')}>
  Withdraw
</button>
```

---

### 6. Portfolio page uses fully hardcoded mock data — not real user trades
**File:** `frontend/src/pages/Portfolio.jsx`  
**Problem:** The portfolio holdings (`BTC`, `ETH`, `TSLA`, `AAPL`, `SOL`, `MSFT`) are a static array. No trades from the Trade page are persisted or reflected here. "All Time" return of 15.4% is hardcoded. This page is completely disconnected from actual user activity.

**Fix options (pick one):**
- **Option A (Simple):** Use `localStorage` to store trades placed via the Trade page and read them here.
- **Option B (Full):** Create a backend endpoint `POST /api/portfolio/trade` and `GET /api/portfolio` backed by MongoDB, tied to the Clerk user ID.

---

### 7. Wallet balance is hardcoded — not connected to trades or payments
**File:** `frontend/src/pages/Wallet.jsx`  
**Problem:** `const [balance] = useState(24500.00)` — hardcoded. Placing a trade or completing a payment never changes the wallet balance.

**Fix:** Store balance in `localStorage` or backend, deduct/add on trade/payment events.

---

### 8. Footer links "Privacy Policy" and "Terms of Service" go to `href="#"`
**File:** `frontend/src/pages/Landing.jsx` (lines 314–315)  
**Problem:** These are dead links that do nothing.

**Fix:** Either create `/privacy` and `/terms` routes (with `Placeholder` pages), or remove the links temporarily.

---

### 9. `/documentation`, `/features`, `/updates` routes show placeholder
**Files:** `App.jsx`, `Placeholder.jsx`  
**Problem:** These three footer links all render a "Coming Soon" construction page. If this is intentional, fine — but they appear in the public footer as real links.

**Fix:** Either build real content or add a visual "Coming Soon" badge to the links in the footer.

---

### 10. Trade page — "Sell" tab is non-functional
**File:** `frontend/src/pages/Trade.jsx`  
**Problem:** The Trade panel has "Buy" and "Sell" tabs, but `handleBuyNow` only handles buying. The Sell tab likely shares the same form. No sell logic, no portfolio check, no proceeds calculation.

**Fix:** Add a `handleSellNow` function that checks portfolio holdings and processes the sell.

---

### 11. MongoDB is unused / connection may fail
**File:** `backend/config/db.js`, `backend/.env`  
**Problem:** `MONGO_URI=mongodb://localhost:27017/tradesim` — a local MongoDB instance. If MongoDB is not running locally (or in production), `connectDB()` will log an error but the server continues. The `User` model exists but is never used by any route. No portfolio, trade history, or wallet data is persisted.

**Fix for local dev:** Install and run MongoDB, or switch URI to a MongoDB Atlas free cluster:
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/tradesim
```

---

### 12. Dashboard — "Refresh" button reloads data but doesn't show feedback
**File:** `frontend/src/pages/Dashboard.jsx`  
**Minor:** The `refreshing` state is set but no spinner or visual feedback is shown during refresh. The button UX is slightly broken.

**Fix:** Add a spinning animation to the `<RefreshCw>` icon when `refreshing === true`:
```jsx
<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
```

---

## 🟡 PARTIALLY WORKING — Works but with Limitations

| Issue | Location | Notes |
|---|---|---|
| News on Dashboard opens `window.open` for external URLs, but `/news/:id` route exists for internal detail page | `Dashboard.jsx`, `NewsDetail.jsx` | Internal route is never linked from dashboard news items |
| OrderBook in Trade page — renders fake/simulated data, not live order book | `OrderBook.jsx` | Expected for a sim platform |
| StrategyBuilder in Trade page — UI only, no logic persisted | `StrategyBuilder.jsx` | Expected for a sim platform |
| Chart layout saved to `localStorage` but `localStorage` is used in Artifacts environment where it may fail | `Trade.jsx` | Only a risk if embedded in certain iframe environments |
| `Login-updated.jsx` exists as an alternate file but is not imported anywhere | `pages/` | Dead file — can be deleted |

---

## 📋 PRIORITY FIX ORDER

| Priority | Issue | Effort |
|---|---|---|
| 🔴 P1 | Fix `logout` in AuthContext — users can't sign out | 5 min |
| 🔴 P1 | Add `VITE_BACKEND_URL` to frontend `.env.local` | 1 min |
| 🔴 P1 | Add Razorpay keys to backend `.env` | 5 min |
| 🔴 P2 | Wire real user data in Settings page | 30 min |
| 🔴 P2 | Make Wallet Withdraw button functional | 10 min |
| 🔴 P3 | Connect Portfolio to real trade data (localStorage at minimum) | 2–4 hrs |
| 🔴 P3 | Connect Wallet balance to real transactions | 2–4 hrs |
| 🟡 P4 | Add Sell functionality in Trade page | 1–2 hrs |
| 🟡 P4 | Fix Dashboard Refresh button spinner | 5 min |
| 🟡 P5 | Fix footer dead links (Privacy Policy, ToS) | 15 min |
| 🟡 P5 | Set up MongoDB Atlas (replace localhost URI) | 30 min |

---

## 🛠 Code Fixes — Copy-Paste Ready

### Fix 1: AuthContext — add logout

In `frontend/src/context/AuthContext.jsx`, replace the import and body:

```jsx
import React, { createContext, useContext } from 'react';
import { useAuth as useClerkAuth, useUser, useClerk } from '@clerk/clerk-react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const { isLoaded, isSignedIn } = useClerkAuth();
    const { user } = useUser();
    const { signOut } = useClerk();

    const authContextValue = {
        user: isSignedIn ? {
            id: user?.id,
            email: user?.primaryEmailAddress?.emailAddress,
            name: user?.fullName || user?.firstName,
            image: user?.imageUrl,
        } : null,
        isSignedIn,
        isLoaded,
        loading: !isLoaded,
        logout: () => signOut(),   // ← ADD THIS
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
```

---

### Fix 2: Settings — use real Clerk user data

Replace the profile section in `frontend/src/pages/Settings.jsx`:

```jsx
import { useAuth } from '../context/AuthContext';
import { useClerk } from '@clerk/clerk-react';

export default function Settings() {
    const { user } = useAuth();
    const { openUserProfile } = useClerk();
    const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
    // ... rest of component

    // Profile card:
    <div className="w-20 h-20 ...">
        {user?.image 
            ? <img src={user.image} className="w-full h-full rounded-full object-cover" />
            : initials
        }
    </div>
    <h3>{user?.name || 'User'}</h3>
    <p>{user?.email}</p>
    <button onClick={() => openUserProfile()}>Change Avatar</button>

    // Inputs:
    <input type="text" value={user?.name || ''} readOnly />
    <input type="email" value={user?.email || ''} readOnly />

    // Security buttons:
    <button onClick={() => openUserProfile()}>Change Password</button>
    <button onClick={() => openUserProfile()}>Two-Factor Authentication</button>
```

---

### Fix 3: Dashboard refresh spinner

In `Dashboard.jsx`, find the RefreshCw icon and update:
```jsx
<RefreshCw size={16} className={`${refreshing ? 'animate-spin' : ''} transition-transform`} />
```

---

### Fix 4: `frontend/.env.local` — complete file

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Z2VuZXJvdXMtbW9vc2UtODIuY2xlcmsuYWNjb3VudHMuZGV2JA
VITE_BACKEND_URL=http://localhost:5000
```

---

### Fix 5: `backend/.env` — add Razorpay keys

```
# (add these lines)
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET
```

