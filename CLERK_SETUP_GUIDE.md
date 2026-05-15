# Clerk Authentication Setup Guide

This guide will help you set up Clerk authentication for the Trading Project.

## Overview

I've integrated **Clerk** into your application, replacing the previous JWT-based authentication system. Clerk handles user management, authentication, and session management with minimal overhead.

## What Changed

### Backend Changes

- **Removed**: JWT token generation and password hashing logic
- **Added**: Clerk middleware (`@clerk/express`) for token verification
- **Modified**: `authMiddleware.js` to use Clerk's `requireAuth()` instead of JWT verification
- **Simplified**: `authController.js` now only has a `/me` endpoint that returns Clerk user info

### Frontend Changes

- **Removed**: Manual JWT token storage in localStorage
- **Added**: `ClerkProvider` wrapper in `App.jsx`
- **Replaced**: Custom `login()` and `register()` functions in AuthContext with Clerk's auth state
- **Updated**: Login and Register pages to use Clerk's `SignIn` and `SignUp` components

## Setup Instructions

### Step 1: Create a Clerk Account

1. Go to [clerk.com](https://clerk.com) and sign up for a free account
2. Create a new application (select your preferred authentication methods)
3. Copy your **Publishable Key** and **Secret Key**

### Step 2: Configure Backend Environment Variables

Create or update `.env` file in the `backend/` directory:

```env
# Clerk Configuration
CLERK_PUBLISH_KEY=YOUR_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_CLERK_SECRET_KEY

# Other existing variables
PORT=5000
MONGODB_URI=your_mongodb_uri
# ... other variables
```

### Step 3: Configure Frontend Environment Variables

Create or update `.env.local` file in the `frontend/` directory:

```env
VITE_CLERK_PUBLISHABLE_KEY=YOUR_CLERK_PUBLISHABLE_KEY
```

### Step 4: Update Clerk Dashboard Settings

In the Clerk Dashboard:

1. **Allowed Origins**: Add your frontend URLs
   - Local: `http://localhost:5173`
   - Production: `https://your-domain.com`

2. **Redirect URLs**: Set these for sign-in/sign-up redirects
   - Sign-in: `http://localhost:5173/dashboard` (local) or your production URL
   - Sign-up: `http://localhost:5173/dashboard` (local) or your production URL

3. **API Routes** (Optional but recommended):
   - Go to API Keys and generate a key for backend use if needed

### Step 5: Update CORS in Backend

If your frontend and backend are on different domains, ensure CORS is properly configured in `backend/server.js`:

```javascript
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://your-domain.com"
    ],
    credentials: true
  })
);
```

### Step 6: Start Your Application

**Backend**:

```bash
cd backend
npm install  # Already done
npm run dev  # or npm start
```

**Frontend**:

```bash
cd frontend
npm install  # Already done
npm run dev
```

### Step 7: Test Authentication

1. Navigate to `http://localhost:5173/register`
2. Create a new account
3. You should be redirected to `/dashboard` after successful sign-up
4. Test login at `http://localhost:5173/login`

## API Integration

### Getting the Current User

To verify authentication on the backend, protected routes use the `protect` middleware:

```javascript
// Example protected route
app.get("/api/user-profile", protect, (req, res) => {
  // req.auth contains:
  // - userId: Clerk's unique user ID
  // - sessionId: Current session ID

  res.json({
    userId: req.auth.userId,
    sessionId: req.auth.sessionId
  });
});
```

### Frontend User Access

In React components, use the Clerk hooks:

```javascript
import { useAuth, useUser } from "@clerk/clerk-react";

function MyComponent() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  if (!isLoaded) return <div>Loading...</div>;

  if (!isSignedIn) return <div>Not signed in</div>;

  return <div>Welcome, {user?.fullName}!</div>;
}
```

## Accessing User Information

The `AuthContext` now exposes:

```javascript
import { useAuth } from "../context/AuthContext";

function MyComponent() {
  const { user, isSignedIn, loading } = useAuth();

  // user object contains:
  // - id: Clerk user ID
  // - email: User's email
  // - name: User's full name
  // - image: User's profile image URL
}
```

## Database Considerations

If you have a User model in MongoDB, you may want to sync Clerk user data:

1. **Option A**: Use Clerk's webhooks to create/update user records when Clerk events occur
2. **Option B**: Create user records on-demand when users first access protected routes
3. **Option C**: Store all user data in Clerk (no local database required)

For now, Clerk is your source of truth for authentication.

## Removing Old Authentication Code

The following files can be safely removed if you're not using them:

- Custom JWT generation logic (already removed from `authController.js`)
- Password hashing utilities (bcryptjs no longer needed if only using Clerk)

## Troubleshooting

### "Clerk Publishable Key not found"

- Ensure `VITE_CLERK_PUBLISHABLE_KEY` is set in `frontend/.env.local`
- Restart the dev server after updating `.env` files

### Redirect loop or stuck on sign-in page

- Check that Clerk redirect URLs are correctly configured in the dashboard
- Verify CORS settings allow your frontend domain
- Check browser console for error messages

### Backend authentication errors

- Verify `CLERK_SECRET_KEY` is set in `backend/.env`
- Ensure Clerk middleware is initialized before protected routes
- Check that the token is being sent in the Authorization header

### CORS errors

- Add your frontend URL to the CORS origins in `backend/server.js`
- Ensure credentials are set to `true` in CORS config

## Next Steps

1. **Optional**: Set up Clerk webhooks for syncing user data to MongoDB
2. **Optional**: Customize the sign-in/sign-up UI using Clerk's appearance API
3. **Optional**: Implement role-based access control using Clerk's custom claims

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk React Guide](https://clerk.com/docs/sdks/react)
- [Clerk Express Guide](https://clerk.com/docs/sdks/node/express)
- [Clerk API Reference](https://clerk.com/docs/reference/backend-api)

## Support

For issues with Clerk:

- Check [Clerk's Support Docs](https://clerk.com/docs)
- Visit [Clerk Community](https://discord.gg/b5rXHjAg7A)

For issues with the integration in this project, refer to the code changes in:

- Backend: `server.js`, `middleware/authMiddleware.js`, `controllers/authController.js`
- Frontend: `App.jsx`, `context/AuthContext.jsx`, `pages/Login.jsx`, `pages/Register.jsx`
