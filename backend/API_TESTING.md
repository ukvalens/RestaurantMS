# Restaurant Management System - API Testing Guide

## Start Server
```bash
cd backend
npm start
```

## Test Database Connection
```bash
node testDb.js
```

## Initialize Database Tables
```bash
node initDb.js
```

## API Testing with curl

### 1. Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"email\":\"admin@restaurant.com\",\"password\":\"admin123\",\"role\":\"admin\"}"
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@restaurant.com\",\"password\":\"admin123\"}"
```

Save the token from response and use it in next requests.

### 3. Create Menu Category (requires token)
```bash
curl -X POST http://localhost:5000/api/menu/categories ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -d "{\"name\":\"Main Course\",\"description\":\"Main dishes\"}"
```

### 4. Get All Categories
```bash
curl http://localhost:5000/api/menu/categories
```

### 5. Create Menu Item (requires token)
```bash
curl -X POST http://localhost:5000/api/menu/items ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -d "{\"category_id\":1,\"name\":\"Grilled Chicken\",\"description\":\"Delicious grilled chicken\",\"price\":15.99}"
```

### 6. Get All Menu Items
```bash
curl http://localhost:5000/api/menu/items
```

### 7. Create Table (requires token)
```bash
curl -X POST http://localhost:5000/api/tables ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -d "{\"table_number\":1,\"capacity\":4}"
```

### 8. Get All Tables (requires token)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:5000/api/tables
```

### 9. Create Order (requires token)
```bash
curl -X POST http://localhost:5000/api/orders ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -d "{\"table_id\":1,\"waiter_id\":1,\"items\":[{\"menu_item_id\":1,\"quantity\":2,\"price\":15.99}]}"
```

### 10. Get All Orders (requires token)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:5000/api/orders
```

### 11. Create Reservation
```bash
curl -X POST http://localhost:5000/api/reservations ^
  -H "Content-Type: application/json" ^
  -d "{\"customer_name\":\"John Doe\",\"customer_phone\":\"1234567890\",\"customer_email\":\"john@example.com\",\"table_id\":1,\"reservation_date\":\"2024-12-25\",\"reservation_time\":\"19:00\",\"party_size\":4}"
```

### 12. Get All Reservations (requires token)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:5000/api/reservations
```

## Test Server Health
```bash
curl http://localhost:5000/
```

Expected response: `{"message":"Restaurant Management System API"}`
