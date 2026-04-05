# Auth0 Setup Guide — Roles, Organizations & WheezyLeague-Member

This guide walks through everything needed to get Auth0 role-based access control working with The Wheezy League, including how the `WheezyLeague-Member` role gates the dashboard and all protected features.

---

## Overview

```
User logs in
     ↓
Auth0 Post-Login Action runs
     ↓
Adds roles + org to the JWT token
     ↓
Frontend reads token → checks WheezyLeague-Member role
     ↓
ProtectedRoute allows or blocks access
     ↓
Backend verifies token + role on every API call
```

---

## Step 1 — Create the WheezyLeague-Member Role

1. Go to **Auth0 Dashboard → User Management → Roles**
2. Click **Create Role**
3. Name: `WheezyLeague-Member`
4. Description: `Full member access to The Wheezy League features`
5. Click **Create**

---

## Step 2 — Create the Post-Login Action (Critical)

Auth0 does NOT put roles in tokens automatically. You need an Action.

1. Go to **Actions → Library → Create Action**
2. Choose **Login / Post Login**
3. Name it: `Add Roles and Org to Token`
4. Paste this exact code:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://wheezyleague.run/'

  // Add roles to both ID token and access token
  const roles = event.authorization?.roles ?? []
  api.idToken.setCustomClaim(`${namespace}roles`, roles)
  api.accessToken.setCustomClaim(`${namespace}roles`, roles)

  // Add organization name (for org-based access control)
  const orgName = event.organization?.name ?? null
  api.idToken.setCustomClaim(`${namespace}org`, orgName)
  api.accessToken.setCustomClaim(`${namespace}org`, orgName)
}
```

5. Click **Deploy**
6. Go to **Actions → Flows → Login**
7. Drag your new action between **Start** and **Complete**
8. Click **Apply**

> ⚠️ Without this Action, `user['https://wheezyleague.run/roles']` will be
> undefined and all users will get the "Access Restricted" screen.

---

## Step 3 — Assign the Role to Users

**Manually (one-off):**
1. Auth0 Dashboard → **User Management → Users**
2. Click the user → **Roles** tab
3. Click **Assign Roles** → select `WheezyLeague-Member`

**Via the Management API (automated onboarding):**
```javascript
// In your backend after a user signs up
const { ManagementClient } = require('auth0')
const management = new ManagementClient({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_MGMT_CLIENT_ID,
  clientSecret: process.env.AUTH0_MGMT_CLIENT_SECRET,
})

await management.assignRolestoUser(
  { id: userSub },
  { roles: [process.env.AUTH0_MEMBER_ROLE_ID] }
)
```

---

## Step 4 — Set Up Organizations (for Partner Run Clubs)

Organizations let you onboard partner clubs (e.g. "Boston Wheezers Run Club") and grant their members access to The Wheezy League.

### Create an Organization
1. Auth0 Dashboard → **Organizations → Create Organization**
2. Name: e.g. `boston-wheezers` (URL-safe slug)
3. Display Name: `Boston Wheezers Run Club`
4. Click **Create**

### Enable Your Application for the Organization
1. Open the organization → **Applications** tab
2. Click **Enable Applications** → select your The Wheezy League SPA

### Add Members
1. Organization → **Members** tab
2. **Add Members** → invite users by email or add existing Auth0 users
3. Optionally assign the `WheezyLeague-Member` role to members within the org

### Login with Organization
When a user logs in through an org invitation link, `event.organization.name` will be set in the Action above and written to their token. The frontend `isMember` check will be `true` for **either**:
- Users with the `WheezyLeague-Member` role, **OR**
- Users who are members of any Auth0 Organization

---

## Step 5 — Environment Variables

### Frontend (`.env.local`)
```env
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your_spa_client_id
VITE_AUTH0_AUDIENCE=https://api.wheezyleague.run
VITE_AUTH0_REDIRECT_URI=http://localhost:3000
```

### Backend (`.env`)
```env
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.wheezyleague.run
```

> The **audience** must match exactly in both frontend and backend. It's the
> API Identifier you set when creating the Auth0 API (Step 6 below).

---

## Step 6 — Create the Auth0 API (for Backend)

1. Auth0 Dashboard → **Applications → APIs → Create API**
2. Name: `The Wheezy League API`
3. Identifier: `https://api.wheezyleague.run`
4. Algorithm: **RS256**
5. Click **Create**

This identifier becomes your `AUTH0_AUDIENCE` env var.

---

## Step 7 — Register Callback URLs

In your Auth0 application settings, add ALL environments:

| Field | Values |
|-------|--------|
| Allowed Callback URLs | `http://localhost:3000, https://yourdomain.com` |
| Allowed Logout URLs   | `http://localhost:3000, https://yourdomain.com` |
| Allowed Web Origins   | `http://localhost:3000, https://yourdomain.com` |

---

## How It Works in the Code

### Frontend role check (`src/hooks/useAuth.js`)
```javascript
const { isMember, hasRole, roles, org } = useAuth()

// isMember = true if:
//   user has 'WheezyLeague-Member' role
//   OR user is in any Auth0 Organization
```

### Route protection (`src/components/auth/ProtectedRoute.jsx`)
```jsx
// Requires WheezyLeague-Member role by default
<Route path="/dashboard" element={
  <ProtectedRoute>
    <DashboardPage />
  </ProtectedRoute>
} />

// Require login only (no role check)
<Route path="/public-page" element={
  <ProtectedRoute requireRole={null}>
    <SomePage />
  </ProtectedRoute>
} />
```

### Backend role check (`backend/src/middleware/auth.js`)
```javascript
// Applied to all /api/* routes
app.use('/api/dashboard', authMiddleware, requireMember, routes)

// The requireMember middleware checks:
//   req.auth['https://wheezyleague.run/roles'].includes('WheezyLeague-Member')
//   OR req.auth['https://wheezyleague.run/org'] is set
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| All users see "Access Restricted" | Post-Login Action not deployed or not attached to Login flow | Re-check Step 2 |
| `roles` is always `[]` | Action deployed but audience not set in frontend | Add `VITE_AUTH0_AUDIENCE` to `.env.local` |
| Backend returns 401 | Token audience mismatch | Ensure `VITE_AUTH0_AUDIENCE` = `AUTH0_AUDIENCE` exactly |
| Backend returns 403 | User authenticated but missing role | Assign `WheezyLeague-Member` role in Auth0 |
| Org users still blocked | Org not enabled for the application | Step 4 → Enable Applications for the org |

---

## Testing Locally Without Roles

In demo mode (`VITE_DATA_MODE=demo`), the role check is **bypassed entirely** — all authenticated users can access everything. This makes local development easy without needing to configure Auth0 roles.

Switch to live mode + real Auth0 roles only when deploying to staging/production.

---

*The Wheezy League — docs/AUTH0_SETUP.md*
