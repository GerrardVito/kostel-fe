# Backend Integration Prompt — Owner → Admin Delegation

Copy the prompt below and paste it to your backend AI/developer. It describes exactly
what the frontend (`OwnerAdminManager.tsx`) expects from the API.

---

## PROMPT START

I need you to implement a backend feature that lets an **owner** add **admins** who have
the same access as the owner for their properties. The frontend is already built and
expects the following three REST endpoints. Please implement them following our existing
auth, routing, and validation conventions.

### Context

- Auth: JWT bearer token in `Authorization: Bearer <token>` header (same as our
  existing `/api/properties`, `/api/applications/*` routes).
- Only users with `role = 'owner'` may call these endpoints. Admins themselves may
  **not** add or revoke other admins (only the original owner can).
- "Admin with all the access of an owner" means: an admin can perform every action the
  owner can (properties CRUD, manage tenants, approve/reject applications, resolve
  maintenance, view finances, schedule inspections, etc.). The simplest implementation
  is to give admin users `role = 'admin'` and treat that role identically to `'owner'`
  in every authorization check, while tracking who delegated to whom so access can be
  revoked.

### Database

Add a `property_admins` table (or equivalent join logic) to track delegated access:

```sql
CREATE TABLE property_admins (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(user_id),   -- the admin user
  added_by      INTEGER NOT NULL REFERENCES users(user_id),   -- the owner who delegated
  scope         VARCHAR(16) NOT NULL DEFAULT 'all',           -- 'all' | 'properties'
  status        VARCHAR(16) NOT NULL DEFAULT 'invited',       -- 'invited' | 'active' | 'revoked'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at    TIMESTAMPTZ,
  UNIQUE (user_id, added_by)
);

CREATE TABLE property_admin_scope (
  property_admin_id INTEGER NOT NULL REFERENCES property_admins(id) ON DELETE CASCADE,
  property_id       INTEGER NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
  PRIMARY KEY (property_admin_id, property_id)
);
```

When `scope = 'all'`, the `property_admin_scope` table is empty and the admin can
access every property owned by `added_by`. When `scope = 'properties'`, only the
properties listed in `property_admin_scope` are accessible.

### Endpoints

#### 1. `GET /api/admins`

List all admins added by the current owner.

- **Auth:** owner only.
- **200 OK** returns an array (or `{ data: [...] }`) of admins:

```json
[
  {
    "id": 12,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+62 812 ...",
    "profile_image": null,
    "status": "active",
    "scope": "all",
    "property_ids": [],
    "created_at": "2026-07-21T10:00:00Z",
    "added_by": { "id": 5, "name": "Owner Name" }
  }
]
```

- Exclude `revoked` entries, OR include them with `status: "revoked"` so the frontend
  can render history. Frontend currently filters out `revoked` from the main list, so
  either is fine.
- `id` MUST be the **admin user's** `user_id` (the same id used in `DELETE /api/admins/:id`
  and in the `revokeTarget.id` flow). The frontend also uses it to prevent an owner
  from revoking their own primary access.

#### 2. `POST /api/admins`

Add a new admin (or upgrade an existing user to admin). The frontend sends:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+62 812 ...",            // optional, may be undefined
  "scope": "all",                     // or "properties"
  "property_ids": [1, 2, 3]           // only when scope = "properties"
}
```

- **Auth:** owner only.
- **Validation:**
  - `name` and `email` are required.
  - `email` must be a valid email and unique among users (or already mapped to an
    existing user).
  - If `scope = "properties"`, `property_ids` must be a non-empty array of property
    ids owned by the current owner.
  - Reject if the email matches the current owner (an owner cannot add themselves).
  - Reject if the email is already an active admin added by this owner.
- **Behavior:**
  - **Case A — user with that email already exists:** upgrade their role to `'admin'`
    (or set them as a delegated admin in `property_admins`), set `status = 'active'`,
    and create the scope rows if `scope = 'properties'`. Send a notification email.
    Return `{ invited: false }`.
  - **Case B — user does not exist:** create a new user record with role `'admin'`,
    `status = 'invited'`, generate a temporary password or an invite token (e.g.
    `/invite-admin/:token`), and email them. The user becomes `active` after they
    first log in or set their password. Return `{ invited: true }`.
- **Response 201:**

```json
{
  "id": 12,
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+62 812 ...",
  "status": "active",          // or "invited"
  "scope": "all",
  "property_ids": [],
  "created_at": "2026-07-21T10:00:00Z",
  "added_by": { "id": 5, "name": "Owner Name" },
  "invited": false             // true if an invitation email was sent (new user)
}
```

- **Errors:** `400` for validation, `401` for unauthenticated, `403` for non-owners,
  `409` if already an active admin.

#### 3. `DELETE /api/admins/:id`

Revoke admin access for a delegated admin.

- **Auth:** owner only. `:id` is the admin user's `user_id`.
- **Rules:**
  - The owner may only revoke admins they added (`property_admins.added_by = current user`).
  - The owner cannot revoke their own primary owner access (reject if `:id` ==
    `current_user.id`).
  - On success: set `property_admins.status = 'revoked'`, `revoked_at = NOW()`,
    delete rows from `property_admin_scope`, and downgrade the user's role from
    `'admin'` back to `'tenant'` (or whatever it was before — track this if needed).
    If the user was created purely as an admin invite and never logged in, you may
    choose to disable their account instead.
- **Response 200:** `{ ok: true }` (or the updated admin row).
- **Errors:** `404` if no such admin / not owned by current owner, `403` if trying to
  revoke self, `401` unauthenticated.

### Authorization model going forward

For all existing owner-only endpoints (properties, applications, maintenance, finances,
checklists, inspections, etc.), update the authorization check to accept **both**
`'owner'` and `'admin'` roles. When the acting user is an `'admin'`:

- If their `property_admins.scope = 'all'`, treat them as the owner for all
  properties owned by `added_by`.
- If `scope = 'properties'`, restrict them to only the properties in
  `property_admin_scope`. Return `403` for actions on other properties.

The `/api/auth/me` response should continue to return the user with
`role: "owner" | "admin" | "tenant"`, plus `profile: { profile_image, phone }` so the
frontend can render their identity in the header and profile tab.

### Tests to add

- Owner can list their admins (empty + populated).
- Owner can add an admin (new user → invited=true; existing user → invited=false).
- Owner cannot add themselves, cannot add a duplicate active admin, cannot add with
  empty `property_ids` when `scope='properties'`.
- Non-owner (tenant, or admin trying to add another admin) gets `403`.
- Owner can revoke an admin they added; admin immediately loses access to owner-only
  endpoints.
- Owner cannot revoke their own account (`403`).
- Scoped admin can only access their assigned properties; `scope='all'` admin can
  access every property of the delegating owner.

### Frontend contract summary

| Endpoint                  | Method | Purpose                       |
| ------------------------- | ------ | ----------------------------- |
| `/api/admins`             | GET    | List admins added by owner    |
| `/api/admins`             | POST   | Add / invite a new admin      |
| `/api/admins/:id`         | DELETE | Revoke admin access           |

Please implement these endpoints, the `property_admins` and `property_admin_scope`
tables, the role-based authorization updates, and the tests described above. Return
the route definitions, the SQL migration, and any model changes you make.

## PROMPT END

---

### Frontend expectations recap (for reference)

- File: `src/components/OwnerAdminManager.tsx`
- Mounted in: `src/AuthenticatedApp.tsx` inside the Owner Profile tab.
- Only rendered when `currentUser.role === 'owner'` (admins see the owner experience
  but cannot add/remove other admins).
- Uses `Authorization: Bearer <token>` header on every request.
- Treats `role === 'admin'` identically to `role === 'owner'` in the UI so admins
  see the full owner dashboard, properties, tenants, finances, etc.
