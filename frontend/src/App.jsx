import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import CustomerLayout from './components/CustomerLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tables from './pages/Tables';
import Menu from './pages/Menu';
import Orders from './pages/Orders';
import Reservations from './pages/Reservations';
import Payments from './pages/Payments';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CustomerMenu from './pages/customer/CustomerMenu';
import CustomerReserve from './pages/customer/CustomerReserve';
import MyReservations from './pages/customer/MyReservations';
import CustomerProfile from './pages/customer/CustomerProfile';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import MyOrders from './pages/customer/MyOrders';
import Announcements from './pages/Announcements';

const STAFF = ['admin', 'manager', 'waiter', 'chef'];

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Staff routes */}
          <Route path="/app" element={<ProtectedRoute roles={STAFF}><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/app/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tables" element={<Tables />} />
            <Route path="menu" element={<Menu />} />
            <Route path="orders" element={<Orders />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="payments" element={<ProtectedRoute roles={['admin', 'manager']}><Payments /></ProtectedRoute>} />
            <Route path="users" element={<ProtectedRoute roles={['admin']}><Users /></ProtectedRoute>} />
            <Route path="profile" element={<Profile />} />
            <Route path="change-password" element={<ChangePassword />} />
            <Route path="settings" element={<ProtectedRoute roles={['admin']}><Settings /></ProtectedRoute>} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="*" element={<Navigate to="/app/dashboard" />} />
          </Route>

          {/* Customer routes */}
          <Route path="/customer" element={<ProtectedRoute roles={['customer']}><CustomerLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/customer/dashboard" />} />
            <Route path="dashboard" element={<CustomerDashboard />} />
            <Route path="menu" element={<CustomerMenu />} />
            <Route path="reserve" element={<CustomerReserve />} />
            <Route path="my-reservations" element={<MyReservations />} />
            <Route path="my-orders" element={<MyOrders />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="profile" element={<CustomerProfile />} />
            <Route path="change-password" element={<ChangePassword />} />
            <Route path="*" element={<Navigate to="/customer/dashboard" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
