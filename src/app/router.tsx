import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext.tsx'
import { NotFoundPage } from '../pages/public/NotFoundPage.tsx'
import { PublicLayout } from '../components/layout/PublicLayout.tsx'
import { AppLayout } from '../components/layout/AppLayout.tsx'
import { LandingPage } from '../pages/public/LandingPage.tsx'
import { LoginPage } from '../pages/public/LoginPage.tsx'
import { RegisterPage } from '../pages/public/RegisterPage.tsx'
import { OnboardingPage } from '../pages/public/OnboardingPage.tsx'
import { HomePage } from '../pages/app/HomePage.tsx'
import { HistoryPage } from '../pages/app/HistoryPage.tsx'
import { RoutesPage } from '../pages/app/RoutesPage.tsx'
import { ActivityDetailPage } from '../pages/app/ActivityDetailPage.tsx'
import { RouteDetailPage } from '../pages/app/RouteDetailPage.tsx'
import { NewActivityPage } from '../pages/app/NewActivityPage.tsx'
import { HikingFormPage } from '../pages/app/HikingFormPage.tsx'
import { RockClimbingFormPage } from '../pages/app/RockClimbingFormPage.tsx'
import { ExpeditionFormPage } from '../pages/app/ExpeditionFormPage.tsx'
import { AdminLayout } from '../components/admin/AdminLayout.tsx'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage.tsx'
import { AdminMembersPage } from '../pages/admin/AdminMembersPage.tsx'
import { AdminActivitiesPage } from '../pages/admin/AdminActivitiesPage.tsx'
import { RequireAuth } from '../components/auth/RequireAuth.tsx'
import { RequireAdmin } from '../components/auth/RequireAdmin.tsx'
import { EditActivityPage } from '../pages/app/EditActivityPage.tsx'
import { HelpPage } from '../pages/app/HelpPage.tsx'

/**
 * Root layout: renders AuthProvider around the entire route tree.
 *
 * Placing AuthProvider here (inside RouterProvider) rather than in main.tsx
 * allows AuthContext to call useNavigate(), which is required so that logout()
 * can navigate to "/" after clearing state — without a race against RequireAuth.
 */
function RootWithAuth() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}

export const router = createBrowserRouter([
  {
    element: <RootWithAuth />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: '/', element: <LandingPage /> },
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
      { path: '/onboarding', element: <OnboardingPage /> },
      {
        path: '/app',
        element: (
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        ),
        children: [
          { index: true, element: <HomePage /> },
          { path: 'history/:activitySlug', element: <ActivityDetailPage /> },
          { path: 'history/:activitySlug/edit', element: <EditActivityPage /> },
          { path: 'history', element: <HistoryPage /> },
          { path: 'routes/:routeSlug', element: <RouteDetailPage /> },
          { path: 'routes', element: <RoutesPage /> },
          { path: 'new', element: <NewActivityPage /> },
          { path: 'new/hiking', element: <HikingFormPage /> },
          { path: 'new/climbing', element: <RockClimbingFormPage /> },
          { path: 'new/expedition', element: <ExpeditionFormPage /> },
          { path: 'help', element: <HelpPage /> },
          // Unknown /app/* child routes redirect back to /app home.
          { path: '*', element: <Navigate to="/app" replace /> },
        ],
      },
      {
        path: '/admin',
        element: (
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        ),
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'members', element: <AdminMembersPage /> },
          { path: 'activities', element: <AdminActivitiesPage /> },
          // Unknown /admin/* child routes redirect back to /admin home.
          { path: '*', element: <Navigate to="/admin" replace /> },
        ],
      },
      // Catch-all: any unmatched path renders the 404 page.
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
