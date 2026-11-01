import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { Home } from './pages/Home';
import { Items } from './pages/Items';
import { ItemDetail } from './pages/ItemDetail';
import { Install } from './pages/Install';
import { NotFound } from './pages/NotFound';
import { AdminAuthProvider } from './pages/admin/useAdminAuth';

// Admin lazy chunks
const AdminGuard = lazy(() =>
  import('./pages/admin/AdminGuard').then(m => ({ default: m.AdminGuard }))
);
const Login = lazy(() => import('./pages/admin/Login'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const ItemForm = lazy(() => import('./pages/admin/ItemForm'));

function AdminSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'items', element: <Items /> },
      { path: 'item/:id', element: <ItemDetail /> },
      { path: 'install', element: <Install /> },
      {
        path: 'admin',
        element: <AdminAuthProvider />,
        children: [
          {
            index: true,
            element: (
              <AdminSuspense>
                <Login />
              </AdminSuspense>
            ),
          },
          {
            element: (
              <AdminSuspense>
                <AdminGuard />
              </AdminSuspense>
            ),
            children: [
              {
                path: 'items',
                element: (
                  <AdminSuspense>
                    <Dashboard />
                  </AdminSuspense>
                ),
              },
              {
                path: 'items/new',
                element: (
                  <AdminSuspense>
                    <ItemForm />
                  </AdminSuspense>
                ),
              },
              {
                path: 'items/:id/edit',
                element: (
                  <AdminSuspense>
                    <ItemForm />
                  </AdminSuspense>
                ),
              },
            ],
          },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
