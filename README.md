# 🍴 RestaurantMS — Restaurant Management System

A full-stack restaurant management system built with **React**, **Node.js/Express**, and **PostgreSQL (Supabase)**. Deployed on **Vercel**.

🌐 **Live Demo:** [restaurant-management-system-kappa-eight.vercel.app](https://restaurant-management-system-kappa-eight.vercel.app)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Roles & Permissions](#roles--permissions)
- [Order Flow](#order-flow)
- [Screenshots](#screenshots)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Author](#author)

---

## Overview

RestaurantMS is a comprehensive restaurant management platform that handles the full lifecycle of a restaurant operation — from customer menu browsing and order placement, through waiter service and payment processing, to admin reporting and user management.

---

## Features

### 👤 Authentication & Users
- JWT-based authentication with role-based access control
- User registration, login, forgot/reset password via email
- Profile management with avatar upload
- Admin-controlled role & permission management per role
- New user registration triggers admin notification

### 🍽️ Menu Management
- Create, edit, delete menu items and categories
- Upload item images
- Enable/disable item availability
- Public menu display on home page

### 📋 Orders
- Waiter creates orders linked to tables
- Customer places orders via cart (menu browsing)
- Real-time order status tracking: `pending → preparing → ready → served → completed`
- Order detail view with itemized breakdown
- **Payment Slip** generation after payment approval (printable)

### 📅 Reservations
- Staff and customers can create reservations
- Filter by date, status, customer
- Status management: `pending → confirmed → completed → cancelled`

### 💳 Payments
- Process payments (cash, card, online)
- 18% VAT calculation on payment slips
- Revenue tracking and filtering
- Payment triggers order completion and table release

### 🚚 Deliveries
- Customer requests delivery with Rwanda district selector
- Auto-calculated delivery fee based on distance from Kigali
- Driver assignment and status tracking
- Progress tracker: `pending → assigned → picked_up → in_transit → delivered`

### 🪑 Tables
- Table management with status: `available / occupied / reserved`
- Capacity tracking

### 📢 Announcements
- Admin/manager posts announcements with priority levels (normal, info, urgent)
- All users receive bell notification on new announcement
- Reply system — any user can reply, admin/manager can delete
- Top 3 shown by default, sorted by priority

### 🔔 Notifications
- Real-time bell notifications for: new orders, reservations, deliveries, announcements, new user registrations
- Mark as read / mark all read / delete
- Polls every 10 seconds for live updates

### 🔐 Role Permissions
- Admin can configure which pages each role can access
- Changes stored in DB and applied to all users within 15 seconds (no re-login needed)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, React Router 7 |
| Styling | Custom CSS (mobile-first, responsive) |
| Icons | Font Awesome 6 (CDN) |
| HTTP Client | Axios |
| Notifications | react-hot-toast |
| Backend | Node.js, Express |
| Database | PostgreSQL (Supabase) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Email | Nodemailer (Gmail SMTP) |
| File Upload | Multer (base64 storage) |
| Deployment | Vercel (frontend + serverless API) |

---

## Roles & Permissions

| Role | Access |
|---|---|
| **Admin** | Full access — all pages + user management + permissions |
| **Manager** | Orders, deliveries, reservations, payments, tables, menu, announcements |
| **Waiter** | Orders & slips, reservations, tables, menu, announcements |
| **Delivery** | My deliveries, announcements |
| **Customer** | Browse menu, place orders, reservations, deliveries, announcements |

Permissions are configurable per role by the admin from the User Management → Role Permissions tab.

---

## Order Flow

```
Customer                    Waiter                  Manager/Admin
   │                           │                          │
   ├─ Browse Menu               │                          │
   ├─ Add to Cart               │                          │
   ├─ Place Order ──────────────► Receives notification    │
   │                           ├─ Update: preparing        │
   │                           ├─ Update: ready            │
   │                           ├─ Update: served           │
   │                           ├─ Generate Slip            │
   │                           │                          ├─ Process Payment
   │                           │                          ├─ Order → completed
   ├─ View Payment Slip ◄───────────────────────────────────┘
   └─ Print / Save
```

---

## Project Structure

```
RestaurantMS/
├── api/
│   └── index.js              # Serverless Express API (deployed on Vercel)
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js      # Axios instance with auth interceptor
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── CustomerSidebar.jsx
│   │   │   ├── Topbar.jsx
│   │   │   ├── CustomerTopbar.jsx
│   │   │   ├── NotificationBell.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── CustomerLayout.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── AppFooter.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── NotificationContext.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── Reservations.jsx
│   │   │   ├── Payments.jsx
│   │   │   ├── Tables.jsx
│   │   │   ├── Menu.jsx
│   │   │   ├── Deliveries.jsx
│   │   │   ├── Users.jsx
│   │   │   ├── Announcements.jsx
│   │   │   ├── PaymentSlip.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── ResetPassword.jsx
│   │   │   └── customer/
│   │   │       ├── CustomerDashboard.jsx
│   │   │       ├── CustomerMenu.jsx
│   │   │       ├── CustomerReserve.jsx
│   │   │       ├── MyReservations.jsx
│   │   │       ├── MyOrders.jsx
│   │   │       ├── MyDeliveries.jsx
│   │   │       └── CustomerProfile.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   └── package.json
├── vercel.json               # Vercel deployment config
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Gmail account for email (SMTP)

### 1. Clone the repository
```bash
git clone https://github.com/ukvalens/RestaurantMS.git
cd RestaurantMS
```

### 2. Install frontend dependencies
```bash
cd frontend
npm install
```

### 3. Set up environment variables
Create a `.env` file in the root:
```env
DATABASE_URL=your_supabase_connection_string
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
FRONTEND_URL=http://localhost:5173
```

Create `frontend/.env`:
```env
VITE_API_URL=/api
```

### 4. Set up the database
Run the SQL in Supabase SQL Editor:
```sql
-- See database/schema.sql for full schema
-- Also run:
CREATE TABLE IF NOT EXISTS role_permissions (
  role VARCHAR(20) PRIMARY KEY,
  permissions TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS announcement_replies (
  id SERIAL PRIMARY KEY,
  announcement_id INTEGER NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. Run locally
```bash
# Frontend
cd frontend
npm run dev

# API (from root)
node api/index.js
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Supabase) |
| `JWT_SECRET` | Secret key for JWT token signing |
| `EMAIL_USER` | Gmail address for sending emails |
| `EMAIL_PASS` | Gmail App Password (not your regular password) |
| `FRONTEND_URL` | Frontend URL for password reset links |

---

## API Endpoints

### Auth
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/forgot-password` | Public |
| POST | `/api/auth/reset-password` | Public |
| PUT | `/api/auth/profile` | Authenticated |
| PUT | `/api/auth/change-password` | Authenticated |
| GET | `/api/auth/users` | Admin |
| POST | `/api/auth/users` | Admin |
| PUT | `/api/auth/users/:id` | Admin |
| DELETE | `/api/auth/users/:id` | Admin |
| GET | `/api/auth/permissions` | Public |
| PUT | `/api/auth/permissions` | Admin |

### Core Resources
| Method | Endpoint | Access |
|---|---|---|
| GET/POST | `/api/tables` | Authenticated |
| GET/POST/PUT/DELETE | `/api/menu/items` | Authenticated |
| GET/POST/PUT/DELETE | `/api/orders` | Authenticated |
| GET | `/api/orders/:id` | Authenticated |
| GET/POST/PUT/DELETE | `/api/reservations` | Authenticated |
| GET/POST/DELETE | `/api/payments` | Authenticated |
| GET/POST/PUT/DELETE | `/api/deliveries` | Authenticated |
| GET/POST/DELETE | `/api/announcements` | Authenticated |
| GET/POST/DELETE | `/api/announcements/:id/replies` | Authenticated |
| GET/PUT/DELETE | `/api/notifications` | Authenticated |

---

## Author

**Ukwitegetse Valens**
- 📧 [ukwitegetsev9@gmail.com](mailto:ukwitegetsev9@gmail.com)
- 📞 +250 780 468 216

---

## License

This project was built as part of the **kLab** training program.

© 2025 RestaurantMS — All rights reserved.
