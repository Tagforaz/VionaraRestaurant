import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "@/auth";
import { CartProvider } from "@/features/cart";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import Index from "./pages/Index";
import MenuPage from "./pages/MenuPage";
import ProductDetail from "./pages/ProductDetail";
import CartPage from "./pages/CartPage";
import ReservationsPage from "./pages/ReservationsPage";
import AboutPage from "./pages/AboutPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CheckoutPage from "./pages/CheckoutPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMenuPage from "./pages/admin/AdminMenuPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminReservationsPage from "./pages/admin/AdminReservationsPage";
import AdminReviewsPage from "./pages/admin/AdminReviewsPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import AdminQRPage from "./pages/admin/AdminQRPage";
import AdminCouriersPage from "./pages/admin/AdminCouriersPage";
import { AdminRoleManagement } from "./pages/admin/AdminRoleManagement";
import { ChefDashboard } from "./pages/chef/ChefDashboard";
import { ChefOrders } from "./pages/chef/ChefOrders";
import { CourierDashboard } from "./pages/courier/CourierDashboard";
import { CourierDeliveries } from "./pages/courier/CourierDeliveries";
import { WaiterDashboard } from "./pages/waiter/WaiterDashboard";
import { WaiterReservations } from "./pages/waiter/WaiterReservations";
import { WaiterOrders } from "./pages/waiter/WaiterOrders";
import { WaiterNewOrder } from "./pages/waiter/WaiterNewOrder";
import { ModeratorDashboard } from "./pages/moderator/ModeratorDashboard";
import { ModeratorOrders } from "./pages/moderator/ModeratorOrders";
import { ModeratorReservations } from "./pages/moderator/ModeratorReservations";
import { ModeratorReviews } from "./pages/moderator/ModeratorReviews";
import { ModeratorQRCodes } from "./pages/moderator/ModeratorQRCodes";
import QRMenuPage from "./pages/QRMenuPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import NotFound from "./pages/NotFound";
import { ProfileInfo } from "./pages/profile/ProfileInfo";
import { ProfileSecurity } from "./pages/profile/ProfileSecurity";
import { ProfileNotifications } from "./pages/profile/ProfileNotifications";

const queryClient = new QueryClient();

const App = () => {
  const { i18n } = useTranslation();
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <div key={i18n.language}>
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Index />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/menu/:id" element={<ProductDetail />} />
              <Route path="/qr-menu" element={<QRMenuPage />} />
              <Route path="/qr-menu/:id" element={<ProductDetail />} />
              <Route path="/order-tracking/:orderId" element={<OrderTrackingPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/reservations" element={<ReservationsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/menu" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminMenuPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/orders" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminOrdersPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/reservations" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminReservationsPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/reviews" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminReviewsPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/settings" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminSettingsPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/qr-codes" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminQRPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/couriers" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminCouriersPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/roles" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminRoleManagement />
                </ProtectedRoute>
              } />
              
              {/* Chef Routes */}
              <Route path="/chef" element={
                <ProtectedRoute allowedRoles={['chef']}>
                  <ChefDashboard />
                </ProtectedRoute>
              } />
              <Route path="/chef/orders" element={
                <ProtectedRoute allowedRoles={['chef']}>
                  <ChefOrders />
                </ProtectedRoute>
              } />
              
              {/* Courier Routes */}
              <Route path="/courier" element={
                <ProtectedRoute allowedRoles={['courier']}>
                  <CourierDashboard />
                </ProtectedRoute>
              } />
              <Route path="/courier/deliveries" element={
                <ProtectedRoute allowedRoles={['courier']}>
                  <CourierDeliveries />
                </ProtectedRoute>
              } />
              
              {/* Waiter Routes */}
              <Route path="/waiter" element={
                <ProtectedRoute allowedRoles={['waiter']}>
                  <WaiterDashboard />
                </ProtectedRoute>
              } />
              <Route path="/waiter/reservations" element={
                <ProtectedRoute allowedRoles={['waiter']}>
                  <WaiterReservations />
                </ProtectedRoute>
              } />
              <Route path="/waiter/orders" element={
                <ProtectedRoute allowedRoles={['waiter']}>
                  <WaiterOrders />
                </ProtectedRoute>
              } />
              <Route path="/waiter/orders/new" element={
                <ProtectedRoute allowedRoles={['waiter']}>
                  <WaiterNewOrder />
                </ProtectedRoute>
              } />
              
              {/* Moderator Routes */}
              <Route path="/moderator" element={
                <ProtectedRoute allowedRoles={['moderator']}>
                  <ModeratorDashboard />
                </ProtectedRoute>
              } />
              <Route path="/moderator/orders" element={
                <ProtectedRoute allowedRoles={['moderator']}>
                  <ModeratorOrders />
                </ProtectedRoute>
              } />
              <Route path="/moderator/reservations" element={
                <ProtectedRoute allowedRoles={['moderator']}>
                  <ModeratorReservations />
                </ProtectedRoute>
              } />
              <Route path="/moderator/reviews" element={
                <ProtectedRoute allowedRoles={['moderator']}>
                  <ModeratorReviews />
                </ProtectedRoute>
              } />
              <Route path="/moderator/qr-codes" element={
                <ProtectedRoute allowedRoles={['moderator']}>
                  <ModeratorQRCodes />
                </ProtectedRoute>
              } />
              
              {/* Profile Routes - All Roles */}
              <Route path="/profile" element={
                <ProtectedRoute allowedRoles={['admin', 'chef', 'waiter', 'moderator', 'courier', 'customer']}>
                  <ProfileInfo />
                </ProtectedRoute>
              } />
              <Route path="/profile/security" element={
                <ProtectedRoute allowedRoles={['admin', 'chef', 'waiter', 'moderator', 'courier', 'customer']}>
                  <ProfileSecurity />
                </ProtectedRoute>
              } />
              <Route path="/profile/notifications" element={
                <ProtectedRoute allowedRoles={['admin', 'chef', 'waiter', 'moderator', 'courier', 'customer']}>
                  <ProfileNotifications />
                </ProtectedRoute>
              } />
              
                  {/* Catch-all */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </div>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
