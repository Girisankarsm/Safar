import { SafarSplash } from "@/components/layout/SafarSplash";
import { AuthProvider, ProtectedRoute } from "@/features/auth";
import { I18nBootstrap } from "@/components/I18nBootstrap";
import { CrimeDataBootstrap } from "@/components/CrimeDataBootstrap";
import { AppShell } from "@/components/layout/AppShell";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { ShareTripPage } from "@/pages/ShareTripPage";
import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

const HomePage = lazy(() => import("@/pages/HomePage").then((m) => ({ default: m.HomePage })));
const ComparePage = lazy(() => import("@/pages/ComparePage").then((m) => ({ default: m.ComparePage })));
const RoutesPage = lazy(() => import("@/pages/RoutesPage").then((m) => ({ default: m.RoutesPage })));
const SafetyPage = lazy(() => import("@/pages/SafetyPage").then((m) => ({ default: m.SafetyPage })));
const EmergencyPage = lazy(() => import("@/pages/EmergencyPage").then((m) => ({ default: m.EmergencyPage })));
const TripPage = lazy(() => import("@/pages/TripPage").then((m) => ({ default: m.TripPage })));
const ProfilePage = lazy(() => import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const CommunityActivityPage = lazy(() =>
  import("@/pages/CommunityActivityPage").then((m) => ({ default: m.CommunityActivityPage }))
);
const CrimeDataAdminPage = lazy(() =>
  import("@/pages/admin/CrimeDataAdminPage").then((m) => ({ default: m.CrimeDataAdminPage }))
);

function PageLoader() {
  return <SafarSplash mode="inline" duration={1800} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CrimeDataBootstrap />
        <I18nBootstrap />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/share/:token" element={<ShareTripPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route
              path="/home"
              element={
                <Suspense fallback={<PageLoader />}>
                  <HomePage />
                </Suspense>
              }
            />
            <Route
              path="/routes/compare"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ComparePage />
                </Suspense>
              }
            />
            <Route
              path="/routes"
              element={
                <Suspense fallback={<PageLoader />}>
                  <RoutesPage />
                </Suspense>
              }
            />
            <Route
              path="/safety"
              element={
                <Suspense fallback={<PageLoader />}>
                  <SafetyPage />
                </Suspense>
              }
            />
            <Route
              path="/emergency"
              element={
                <Suspense fallback={<PageLoader />}>
                  <EmergencyPage />
                </Suspense>
              }
            />
            <Route
              path="/trip"
              element={
                <Suspense fallback={<PageLoader />}>
                  <TripPage />
                </Suspense>
              }
            />
            <Route
              path="/trip/:id"
              element={
                <Suspense fallback={<PageLoader />}>
                  <TripPage />
                </Suspense>
              }
            />
            <Route
              path="/community"
              element={
                <Suspense fallback={<PageLoader />}>
                  <CommunityActivityPage />
                </Suspense>
              }
            />
            <Route
              path="/profile"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProfilePage />
                </Suspense>
              }
            />
            <Route
              path="/admin/crime-data"
              element={
                <Suspense fallback={<PageLoader />}>
                  <CrimeDataAdminPage />
                </Suspense>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
