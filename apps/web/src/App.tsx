import { AuthProvider, ProtectedRoute } from "@/features/auth";
import { AppShell } from "@/components/layout/AppShell";
import { EmergencyPage } from "@/pages/EmergencyPage";
import { HomePage } from "@/pages/HomePage";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { RoutesPage } from "@/pages/RoutesPage";
import { SafetyPage } from "@/pages/SafetyPage";
import { CrimeDataAdminPage } from "@/pages/admin/CrimeDataAdminPage";
import { ShareTripPage } from "@/pages/ShareTripPage";
import { TripPage } from "@/pages/TripPage";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
            <Route path="/home" element={<HomePage />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/safety" element={<SafetyPage />} />
            <Route path="/emergency" element={<EmergencyPage />} />
            <Route path="/trip" element={<TripPage />} />
            <Route path="/trip/:id" element={<TripPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin/crime-data" element={<CrimeDataAdminPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
