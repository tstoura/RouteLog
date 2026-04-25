import { createBrowserRouter } from 'react-router-dom'
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

export const router = createBrowserRouter([
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
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'history/:activitySlug', element: <ActivityDetailPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'routes/:routeSlug', element: <RouteDetailPage /> },
      { path: 'routes', element: <RoutesPage /> },
      { path: 'new', element: <NewActivityPage /> },
      { path: 'new/hiking', element: <HikingFormPage /> },
      { path: 'new/climbing', element: <RockClimbingFormPage /> },
      { path: 'new/expedition', element: <ExpeditionFormPage /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'members', element: <AdminMembersPage /> },
      { path: 'activities', element: <AdminActivitiesPage /> },
    ],
  },
])
