# Restaurant Management System - Backend

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Database Setup
Create PostgreSQL database:
```sql
CREATE DATABASE restaurant_management;
```

Run the schema:
```bash
psql -U postgres -d restaurant_management -f database/schema.sql
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and update with your credentials:
```bash
cp .env.example .env
```

### 4. Start Server
```bash
npm run dev
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user

### Menu Management
- GET `/api/menu/categories` - Get all categories
- POST `/api/menu/categories` - Create category (admin/manager)
- GET `/api/menu/items` - Get all menu items
- POST `/api/menu/items` - Create menu item (admin/manager)
- PUT `/api/menu/items/:id` - Update menu item (admin/manager)
- DELETE `/api/menu/items/:id` - Delete menu item (admin/manager)

### Orders
- POST `/api/orders` - Create order
- GET `/api/orders` - Get all orders
- GET `/api/orders/:id` - Get order details
- PUT `/api/orders/:id/status` - Update order status

### Tables
- GET `/api/tables` - Get all tables
- POST `/api/tables` - Create table (admin/manager)
- PUT `/api/tables/:id/status` - Update table status

### Reservations
- GET `/api/reservations` - Get all reservations
- POST `/api/reservations` - Create reservation
- PUT `/api/reservations/:id/status` - Update reservation status

### Payments
- POST `/api/payments` - Process payment
- GET `/api/payments` - Get payment history (admin/manager)

## User Roles
- admin: Full access
- manager: Manage menu, orders, tables, reservations
- waiter: Create orders, view tables
- chef: View orders, update order status
