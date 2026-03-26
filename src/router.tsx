import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShellLayout } from './shared/layouts/AppShellLayout'
import { LoginPage } from './modules/auth/pages/LoginPage'
import { DashboardPage } from './modules/reports/pages/DashboardPage'
import { ProductsListPage } from './modules/products/pages/ProductsListPage'
import { InventoryPage } from './modules/inventory/pages/InventoryPage'
import { OrdersListPage } from './modules/orders/pages/OrdersListPage'
import { CustomersListPage } from './modules/customers/pages/CustomersListPage'
import { IssuesPage } from './modules/orders/pages/IssuesPage'
import { ProtectedRoute } from './shared/routing/ProtectedRoute'
import { Role } from './shared/types/auth'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShellLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute
            allowedRoles={[
              Role.Admin,
              Role.InventoryManager,
              Role.SalesManager,
              Role.Support,
            ]}
          >
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'products',
        element: (
          <ProtectedRoute
            allowedRoles={[Role.Admin, Role.InventoryManager, Role.Customer]}
          >
            <ProductsListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventory',
        element: (
          <ProtectedRoute allowedRoles={[Role.Admin, Role.InventoryManager]}>
            <InventoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders',
        element: (
          <ProtectedRoute
            allowedRoles={[Role.Admin, Role.SalesManager, Role.Support, Role.Customer]}
          >
            <OrdersListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'customers',
        element: (
          <ProtectedRoute
            allowedRoles={[
              Role.Admin,
              Role.Support,
              Role.SalesManager,
              Role.InventoryManager,
            ]}
          >
            <CustomersListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'issues',
        element: (
          <ProtectedRoute allowedRoles={[Role.Admin, Role.Support]}>
            <IssuesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute allowedRoles={[Role.Admin, Role.SalesManager]}>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
])

