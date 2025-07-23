import { Toaster } from "@/components/ui/sonner";
import { Routes, Route } from "react-router-dom";
import ChatSettingsPage from "@/pages/ChatSettingsPage";
import UserSettingsPage from "@/pages/UserSettingsPage";
import SponsorshipsPage from "@/pages/SponsorshipsPage";
import FeaturesPage from "@/pages/FeaturesPage";
import logoVector from "@/assets/logo-vector.svg";

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
          path="/:lang_iso_code/user/:user_id/sponsorships"
          element={<SponsorshipsPage />}
        />
        <Route
          path="/:lang_iso_code/features"
          element={<FeaturesPage />}
        />
        {/* Edge-cases */}
        <Route
          path="*"
          element={
            <div className="flex flex-col gap-10 items-center justify-center h-screen glass-dark-static">
              <img src={logoVector} alt="Logo" className="w-32 h-32" />
              <h1 className="text-4xl font-extralight text-center mb-12">
                {import.meta.env.VITE_APP_NAME}
              </h1>
              <span className="text-5xl font-bold text-center text-accent-strong">
                404 💥
              </span>
            </div>
          }
        />
        <Route
          path="/"
          element={(() => {
            if (window.location.pathname === "/") {
              window.location.href = import.meta.env.VITE_LANDING_PAGE_URL;
            }
            return null;
          })()}
        />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
