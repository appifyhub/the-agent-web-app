import { Toaster } from "@/components/ui/sonner";
import { Routes, Route, Navigate } from "react-router-dom";
import ChatSettingsPage from "@/pages/ChatSettingsPage";
import UserSettingsPage from "@/pages/UserSettingsPage";
import AccessSettingsPage from "@/pages/AccessSettingsPage";
import IntelligenceSettingsPage from "@/pages/IntelligenceSettingsPage";
import SponsorshipsPage from "@/pages/SponsorshipsPage";
import FeaturesPage from "@/pages/FeaturesPage";
import logoVector from "@/assets/logo-vector.svg";
import { DEFAULT_LANGUAGE } from "@/lib/languages";

function App() {
  return (
    <>
      <Routes>
        {/* The settings pages */}
        <Route
          path="/:lang_iso_code/chat/:chat_id/settings"
          element={<ChatSettingsPage />}
        />
        <Route
          path="/:lang_iso_code/user/:user_id/settings"
          element={<UserSettingsPage />}
        />
        <Route
          path="/:lang_iso_code/user/:user_id/access"
          element={<AccessSettingsPage />}
        />
        <Route
          path="/:lang_iso_code/user/:user_id/intelligence"
          element={<IntelligenceSettingsPage />}
        />
        <Route
          path="/:lang_iso_code/user/:user_id/sponsorships"
          element={<SponsorshipsPage />}
        />
        <Route path="/:lang_iso_code/features" element={<FeaturesPage />} />
        {/* Edge-cases */}
        <Route
          path="*"
          element={
            <div className="flex flex-col gap-10 items-center justify-center h-screen glass-dark-static">
              <img src={logoVector} alt="Logo" className="w-32 h-32" />
              <h1 className="text-4xl font-extralight text-center mb-12">
                {import.meta.env.VITE_APP_NAME}
              </h1>
              <span className="text-5xl font-bold text-center text-accent-strong flex flex-col items-center gap-4">
                <p className="text-3xl">⚠️ 404 ⚠️</p>
                <a
                  href={import.meta.env.VITE_LANDING_PAGE_URL}
                  className="text-accent-amber hover:text-white text-lg underline"
                >
                  {import.meta.env.VITE_LANDING_PAGE_URL.replace(
                    "https://",
                    "www."
                  )}
                </a>
              </span>
            </div>
          }
        />
        {/* Root redirects to features page */}
        <Route
          path="/"
          element={
            <Navigate to={`/${DEFAULT_LANGUAGE.isoCode}/features`} replace />
          }
        />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
