# Slooze Food Ordering App

Full-stack food ordering application with role-based and country-based access control.

**Stack:** NestJS + GraphQL + Prisma (backend) · Next.js 14 (frontend)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Frontend                     │
│              (localhost:3001, App Router)               │
│                                                         │
│   Login    Restaurants    My Orders    Payment Methods  │
│   Page     + Cart         Page         Page             │
└────────────────────┬────────────────────────────────────┘
                     │ graphql-request (HTTP + JWT Bearer)
                     │
┌────────────────────▼────────────────────────────────────┐
│              NestJS GraphQL API (localhost:3000)         │
│                                                         │
│  JwtAuthGuard ──► RolesGuard ──► Resolver ──► Service  │
│                                                         │
│   auth/         restaurants/    orders/    payment/     │
│   common/                                               │
│     guards/   JwtAuthGuard, RolesGuard, CountryGuard    │
│     decorators/  @Roles(), @CurrentUser()               │
└────────────────────┬────────────────────────────────────┘
                     │ Prisma 7 + better-sqlite3 adapter
                     │
┌────────────────────▼────────────────────────────────────┐
│                  SQLite (dev.db)                         │
│                                                         │
│  User  Restaurant  MenuItem  Order  OrderItem           │
│  Cart  CartItem  PaymentMethod                          │
└─────────────────────────────────────────────────────────┘
```

### Request lifecycle

1. Request hits NestJS with `Authorization: Bearer <token>`
2. `JwtAuthGuard` verifies the token and attaches the user to the GQL context
3. `RolesGuard` reads `@Roles()` metadata on the resolver and blocks if the role does not match
4. The service layer runs Re-BAC checks (country scoping) before any DB write
5. Prisma executes the query via the better-sqlite3 driver adapter

---

## Access Control

| Feature | Admin | Manager | Member |
|---|:---:|:---:|:---:|
| View restaurants and menus | yes | yes | yes |
| Create order | yes | yes | yes |
| Place order (checkout) | yes | yes | no |
| Cancel order | yes | yes | no |
| Add payment method | yes | yes | yes |
| Update / delete payment method | yes | no | no |

**Re-BAC (country scoping):** Managers and Members only see restaurants in their assigned country (India or America). Admins see everything. This is enforced at the service layer, not the guard, because it requires loading the entity from the DB first.

---

## Pre-seeded Users

All passwords: `Password@123`

| Name | Role | Country | Email |
|---|---|---|---|
| Nick Fury | Admin | Global | nick@slooze.com |
| Captain Marvel | Manager | India | marvel@slooze.com |
| Captain America | Manager | America | america@slooze.com |
| Thanos | Member | India | thanos@slooze.com |
| Thor | Member | India | thor@slooze.com |
| Travis | Member | America | travis@slooze.com |

---

## Running Locally

### Requirements

- Node.js 18+
- npm 9+

### Backend

```bash
# Install dependencies
npm install

# Apply schema and seed the database
npx prisma db push
npm run seed

# Start dev server
npm run start:dev
```

GraphQL playground: http://localhost:3000/graphql

### Frontend

```bash
cd client
npm install
npm run dev -- -p 3001
```

App: http://localhost:3001

### Reset to clean state

```bash
npx prisma db push --force-reset
npm run seed
```

---

## GraphQL API Reference

### Auth

```graphql
mutation {
  login(input: { email: "nick@slooze.com", password: "Password@123" }) {
    accessToken
    name
    role
    country
  }
}
```

Pass the token in subsequent requests:
```
Authorization: Bearer <accessToken>
```

---

### Restaurants

```graphql
query {
  restaurants {
    id name cuisine address country rating
    menuItems { id name price category }
  }
}
```

```graphql
query {
  restaurant(id: "<id>") {
    id name menuItems { id name price }
  }
}
```

---

### Orders

```graphql
# Create (all roles)
mutation {
  createOrder(input: {
    restaurantId: "<id>"
    items: [
      { menuItemId: "<id>", quantity: 2 }
    ]
  }) {
    id totalAmount status
  }
}

# Place / checkout (Admin + Manager only)
mutation {
  placeOrder(orderId: "<id>", paymentMethodId: "<id>") {
    id status
  }
}

# Cancel (Admin + Manager only)
mutation {
  cancelOrder(orderId: "<id>") {
    id status
  }
}

# My orders
query {
  myOrders {
    id status totalAmount createdAt
    items { menuItemId quantity unitPrice }
  }
}
```

---

### Payment Methods

```graphql
# List
query {
  myPaymentMethods { id type provider last4 isDefault }
}

# Add (all roles)
mutation {
  addPaymentMethod(input: {
    type: CARD
    provider: "Visa"
    last4: "1234"
    isDefault: true
  }) { id type provider }
}

# Update (Admin only)
mutation {
  updatePaymentMethod(input: { id: "<id>", isDefault: true }) { id isDefault }
}

# Delete (Admin only)
mutation {
  deletePaymentMethod(id: "<id>") { id }
}
```

---

## Design Notes

**GraphQL code-first** - types live in TypeScript, schema is auto-generated. No schema file to keep in sync manually.

**Re-BAC at the service layer** - guards don't have DB access, so country validation has to happen inside the service after loading the target entity. This also means the check survives even if someone calls the service directly from a test or another service.

**Price snapshot** - `OrderItem.unitPrice` stores the price at the time the order was created. Menu price changes don't affect historical orders.

**Global PrismaModule** - single DB connection shared across all modules. No need to import PrismaModule everywhere.

**Stateless JWT** - token carries role and country claims so guards don't need a DB lookup on every request.
