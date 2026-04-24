# Database Schema

MongoDB, via Mongoose. Three collections: `users`, `expenses`, `budgets`.

## `users`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `name` | String | required, trimmed |
| `email` | String | required, lowercase, trimmed, **unique** |
| `passwordHash` | String | bcrypt hash (cost 10). Never returned by the API |
| `createdAt` | Date | auto |

Indexes:
- `{ email: 1 }` unique

JSON shape returned to clients (via `toJSON` transform that strips `passwordHash`):
```json
{
  "_id": "69eb7c08cb96cfc631b6547a",
  "name": "Test User",
  "email": "test@example.com",
  "createdAt": "2026-04-24T14:19:52.753Z"
}
```

## `expenses`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `userId` | ObjectId | ref `User`, required |
| `amount` | Number | required, `min: 0` |
| `description` | String | required, trimmed |
| `category` | String | required, enum of the 8 categories |
| `date` | Date | defaults to `now` |
| `createdAt` | Date | auto |

Indexes:
- `{ userId: 1 }`
- `{ date: 1 }`
- `{ userId: 1, date: -1 }` — for `GET /api/expenses?month=...` sorted by date desc
- The aggregation in `GET /api/analytics/summary` also benefits from the compound index above

## `budgets`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `userId` | ObjectId | ref `User`, required |
| `category` | String | required, enum of the 8 categories |
| `monthlyLimit` | Number | required, `min: 0` |
| `createdAt` / `updatedAt` | Date | auto |

Indexes:
- `{ userId: 1, category: 1 }` **unique** — one budget per user per category. `PUT /api/budgets` upserts against this.

## Categories (shared enum)

```
Food · Transport · Shopping · Bills · Entertainment · Health · Education · Other
```

Defined once in `backend/src/config/categories.js` and re-used by both models and the frontend.

## Ownership & isolation

Every query in the backend scopes by `userId`:
- Expense list / update / delete match both `_id` and `userId`.
- Budget upsert matches `userId` + `category`.
- Analytics aggregations `$match` on `userId` first.

There is no admin role or cross-user access.
