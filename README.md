# SSG Gas Distribution System

> Internal admin system for LPG cylinder distribution management — Surabaya & Yogyakarta branches.

---

## Tech Stack

| Layer     | Tech                    |
| --------- | ----------------------- |
| Framework | Next.js 14 (App Router) |
| Language  | TypeScript              |
| Styling   | Tailwind CSS            |
| ORM       | Prisma                  |
| Database  | PostgreSQL (local)      |
| Auth      | NextAuth.js             |

---

## Prerequisites

- Node.js `>= 18`
- PostgreSQL running locally
- `npm` or `yarn`

---

## Getting Started

### 1. Clone & Install

```bash
git clone <repo-url>
cd ssg-gas-distribution
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/ssg_db"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Push Database Schema

```bash
npx prisma db push
```

### 4. (Optional) Open Prisma Studio

```bash
npx prisma studio
```

### 5. Run Dev Server

```bash
npm run dev
```

App runs at → **http://localhost:3000**

---

## Project Structure

```
ssg-gas-distribution/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (dashboard)/
│   │   ├── customers/
│   │   ├── suppliers/
│   │   ├── purchase-orders/
│   │   ├── delivery-orders/
│   │   └── warehouse/
│   └── api/
├── prisma/
│   └── schema.prisma
├── components/
├── lib/
└── public/
```

---

## Database — 15 Tables

| Table                     | Description                                   |
| ------------------------- | --------------------------------------------- |
| `Branch`                  | Surabaya & Yogyakarta branch records          |
| `Supplier`                | Supplier master (PT Arsygas Nix Indonesia)    |
| `SupplierHmtQuota`        | HMT price & monthly quota per supplier/branch |
| `Customer`                | Retail, Agen, Industri customers              |
| `SupplierPo`              | Purchase orders to supplier                   |
| `DeliveryOrder`           | Outbound cylinder deliveries                  |
| `InboundReceiving`        | Cylinder stock received from supplier         |
| `EmptyReturn`             | Empty cylinder returns from customers         |
| `CylinderWriteoff`        | Written-off cylinders (damaged/lost)          |
| `WarehouseStock`          | Current stock snapshot per branch/size        |
| `CustomerCylinderHolding` | Cylinders currently held by customers         |
| `GasbackLedger`           | Gasback credit/debit ledger per customer      |
| `GasbackClaim`            | Customer gasback redemption claims            |
| `MonthlyRecon`            | Monthly reconciliation per branch             |
| `User`                    | System users with role-based access           |

---

## Roles

`SUPER_ADMIN` · `BRANCH_MANAGER` · `WAREHOUSE_STAFF` · `SALES_STAFF` · `FINANCE` · `READONLY`

---

## Cylinder Sizes

`3 kg` · `5.5 kg` · `12 kg` · `50 kg`

---

## Branches

| Code  | Branch     |
| ----- | ---------- |
| `SBY` | Surabaya   |
| `YOG` | Yogyakarta |

---

## Available Scripts

```bash
npm run dev       # Start dev server (localhost:3000)
npm run build     # Production build
npm run lint      # ESLint
npx prisma studio # Database GUI
npx prisma db push # Sync schema to DB
```

---

## Development Notes

- Each feature is developed in a **separate conversation** to keep context clean.
- All development targets **localhost** — no deployment config needed yet.
- Branch context is selected at runtime via the branch switcher in the header.
