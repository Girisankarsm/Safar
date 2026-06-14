import { AuthProvider, ProtectedRoute } from "@/features/auth";
import { I18nBootstrap } from "@/components/I18nBootstrap";
import { CrimeDataBootstrap } from "@/components/CrimeDataBootstrap";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { AppShell } from "@/components/layout/AppShell";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { ShareTripPage } from "@/pages/ShareTripPage";
import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

const HomePage = lazy(() => import("@/pages/HomePage").then((m) => ({ default: m.HomePage })));
const RoutesPage = lazy(() => import("@/pages/RoutesPage").then((m) => ({ default: m.RoutesPage })));
const SafetyPage = lazy(() => import("@/pages/SafetyPage").then((m) => ({ default: m.SafetyPage })));
const EmergencyPage = lazy(() => import("@/pages/EmergencyPage").then((m) => ({ default: m.EmergencyPage })));
const TripPage = lazy(() => import("@/pages/TripPage").then((m) => ({ default: m.TripPage })));
const ProfilePage = lazy(() => import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const CrimeDataAdminPage = lazy(() =>
  import("@/pages/admin/CrimeDataAdminPage").then((m) => ({ default: m.CrimeDataAdminPage }))
);

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3B82F6] border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CrimeDataBootstrap />
        <I18nBootstrap />
        <PwaInstallPrompt />
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
