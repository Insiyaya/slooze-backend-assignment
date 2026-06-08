# Slooze Food Ordering API

Role-based food ordering backend built with **NestJS · GraphQL · Prisma**.

## Architecture

```
src/
├── auth/           # JWT authentication (login mutation + strategy)
├── common/
│   ├── decorators/ # @Roles(), @CurrentUser(), @CountryCheck()
│   ├── enums/      # Role, Country
│   └── guards/     # JwtAuthGuard, RolesGuard, CountryGuard (Re-BAC)
├── orders/         # Orders & Cart (create, place, cancel)
├── payment/        # Payment methods (add, update, delete)
├── prisma/         # PrismaService with better-sqlite3 adapter
└── restaurants/    # Restaurants & menu items
prisma/
├── schema.prisma   # Data model
├── seed.ts         # Mock data (all 6 users, 6 restaurants, menus)
└── migrations/     # SQLite migration history
```

## Access Control Matrix

| Feature | Admin | Manager | Member |
|---|:---:|:---:|:---:|
| View restaurants & menu items | ✓ | ✓ | ✓ |
| Create order (add food items) | ✓ | ✓ | ✓ |
| Place order (checkout & pay) | ✓ | ✓ | ✗ |
| Cancel order | ✓ | ✓ | ✗ |
| Update/delete payment method | ✓ | ✗ | ✗ |

**Bonus Re-BAC (country scoping):** Managers and Members can only see and act on restaurants in their assigned country. Admins have global access.

## Pre-seeded Users

| Name | Role | Country | Email | Password |
|---|---|---|---|---|
| Nick Fury | Admin | — | nick@slooze.com | Password@123 |
| Captain Marvel | Manager | India | marvel@slooze.com | Password@123 |
| Captain America | Manager | America | america@slooze.com | Password@123 |
| Thanos | Member | India | thanos@slooze.com | Password@123 |
| Thor | Member | India | thor@slooze.com | Password@123 |
| Travis | Member | America | travis@slooze.com | Password@123 |

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** NestJS 11
- **API:** GraphQL (code-first, Apollo Server)
- **ORM:** Prisma 7 with `better-sqlite3` driver adapter
- **Database:** SQLite (file `./dev.db`)
- **Auth:** Passport JWT (`@nestjs/jwt`, `@nestjs/passport`)
- **Validation:** `class-validator` + `class-transformer`

## Run Locally

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
# 1. Clone the repo and enter the directory
git clone <repo-url>
cd slooze-assignment

# 2. Install dependencies
npm install

# 3. Apply database migrations (creates dev.db)
npx prisma migrate dev

# 4. Seed the database with mock data
npm run seed

# 5. Start the development server
npm run start:dev
```

The GraphQL playground is available at **http://localhost:3000/graphql**

### Reset database

```bash
npm run db:reset   # drops all data, re-migrates, and re-seeds
```

---

## GraphQL API Reference

### Authentication

#### Login
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

Pass the returned `accessToken` in the `Authorization` header for all subsequent requests:
```
Authorization: Bearer <accessToken>
```

---

### Restaurants

#### List restaurants (country-scoped for non-admins)
```graphql
query {
  restaurants {
    id
    name
    cuisine
    address
    country
    rating
    menuItems {
      id
      name
      price
      category
    }
  }
}
```

#### Get a single restaurant
```graphql
query {
  restaurant(id: "<restaurantId>") {
    id
    name
    menuItems { id name price }
  }
}
```

---

### Cart

#### Add item to cart
```graphql
mutation {
  addToCart(input: { menuItemId: "<id>", quantity: 2 }) {
    id
    menuItemId
    quantity
  }
}
```

#### View cart
```graphql
query {
  myCart {
    id
    items { id menuItemId quantity }
  }
}
```

#### Remove item from cart
```graphql
mutation {
  removeFromCart(cartItemId: "<cartItemId>") { id }
}
```

---

### Orders

#### Create order (all roles)
```graphql
mutation {
  createOrder(input: {
    restaurantId: "<id>"
    items: [
      { menuItemId: "<id>", quantity: 2 }
      { menuItemId: "<id>", quantity: 1 }
    ]
  }) {
    id
    totalAmount
    status
    items { menuItemId quantity unitPrice }
  }
}
```

#### Place/checkout order — Admin & Manager only
```graphql
mutation {
  placeOrder(orderId: "<id>", paymentMethodId: "<id>") {
    id
    status
    totalAmount
  }
}
```

#### Cancel order — Admin & Manager only
```graphql
mutation {
  cancelOrder(orderId: "<id>") {
    id
    status
  }
}
```

#### List my orders
```graphql
query {
  myOrders {
    id
    restaurantId
    status
    totalAmount
    createdAt
  }
}
```

---

### Payment Methods

#### List my payment methods
```graphql
query {
  myPaymentMethods {
    id
    type
    provider
    last4
    isDefault
  }
}
```

#### Add a payment method (all roles)
```graphql
mutation {
  addPaymentMethod(input: {
    type: CREDIT_CARD
    provider: "Visa"
    last4: "1234"
    isDefault: true
  }) {
    id
    type
    provider
    isDefault
  }
}
```

#### Update a payment method — Admin only
```graphql
mutation {
  updatePaymentMethod(input: {
    id: "<id>"
    isDefault: true
  }) {
    id
    isDefault
  }
}
```

#### Delete a payment method — Admin only
```graphql
mutation {
  deletePaymentMethod(id: "<id>") { id }
}
```

---

## Re-BAC Country Scoping (Bonus)

Country-based relational access is enforced at the **service layer** (not just guards), because it requires DB lookups to determine the target entity's country.

- **`restaurants` query** — filters by the user's country automatically.
- **`createOrder`** — validates the target restaurant is in the user's country before creating.
- **`placeOrder` / `cancelOrder`** — re-validates the order's restaurant country before state transition.
- **`addToCart`** — validates the menu item's parent restaurant is in the user's country.

Admins bypass all country checks and have global visibility.

**Example:** Thanos (Member-India) calling `restaurants` only sees Indian restaurants. If he tries `createOrder` at a US restaurant, the API returns `403 Forbidden: You can only interact with restaurants in INDIA`.

---

## Design Decisions

| Decision | Rationale |
|---|---|
| GraphQL code-first | Types defined once in TypeScript; schema auto-generated from decorators |
| `@Global()` PrismaModule | Single DB connection shared across all modules without re-importing |
| Re-BAC in service layer | Guards run before DB access; country checks require loading the entity first |
| Price snapshot at order creation | `unitPrice` stored on `OrderItem` — historical orders unaffected by menu price changes |
| JWT stateless auth | No session store needed; token carries role + country claims for fast guard checks |
