# NearPrice

A hyperlocal price comparison platform that lets users find and compare prices of everyday products from nearby vendors in real-time.

**Sahi Daam, Sahi Jagah**

---

## The Problem

When you go to a local market, you have no idea if the vendor is charging a fair price. NearPrice solves this by showing you what the same product costs at multiple nearby shops — before you buy.

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gmail.com | Admin@123 |
| Vendor | vendor@gmail.com | Vendor@123 |
| User | user@gmail.com | User@1234 |

---

## What it does

**Users** can search for products by name, filter by distance (2–20km), view 7-day price trends, set price drop alerts, save favourites, and report vendors with inflated prices.

**Vendors** get a dashboard to manage their products and see market price intelligence — average, lowest, and highest price for any product they're about to list. If their price is 50%+ above market average, they get a real-time warning.

**Admins** can manage users and vendors, verify shops, override prices, and review flagged vendors.

---

## Fraud Detection

The platform uses a human-in-the-loop flagging system instead of auto-banning:

- 3 reports on a vendor's products → warning badge
- 5 reports → flagged for admin review
- Admin sees reporter names, reasons, and product details before deciding
- One user can only report each product once

Auto-ban was intentionally avoided — a coordinated false reporting attack could unfairly remove legitimate vendors.

---

## Why NearPrice?

Most price comparison apps work only for e-commerce — Amazon, Flipkart, Meesho. They don't help when you're standing in a local market wondering if the onion vendor is overcharging you.

NearPrice is built for that exact moment:

- It works hyperlocally — showing only vendors within your chosen radius
- It gives vendors market price data so they price fairly from the start
- It lets the community flag suspicious pricing — with admin oversight to prevent abuse
- It shows price trends so users know whether to buy now or wait

The target users are everyday buyers in Tier 2 and Tier 3 cities where local markets still dominate retail — and where price transparency is nearly zero.

## Tech Stack

- **Frontend** — React + Vite + Tailwind CSS
- **Backend** — Node.js + Express
- **Database** — MongoDB + Mongoose
- **Auth** — JWT + Bcrypt
- **Real-time** — Socket.io (price drop alerts)
- **Images** — Cloudinary + Multer
- **Charts** — Recharts
- **Location** — Browser Geolocation + OpenStreetMap Nominatim

---

## Running Locally

**Backend**

```bash
cd backend
npm install
npm run dev
```

Create a `.env` file in the backend folder:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

**Seed the database** (adds 26 products with 7-day price history)

```bash
cd backend
node seed.js
```

---

## Project Structure

```
NearPrice/
├── backend/
│   ├── config/         # DB and Cloudinary config
│   ├── controllers/    # Route handlers
│   ├── middleware/     # Auth and role guards
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routes
│   ├── utils/          # Price predictor, alert manager
│   └── server.js
│
└── frontend/
    └── src/
        ├── components/ # Navbar, Toast
        ├── context/    # Auth context
        ├── pages/      # All pages
        └── utils/      # Axios instance
```

---

Built by **Vivek Kumar** — B.E. CSE, Chitkara University