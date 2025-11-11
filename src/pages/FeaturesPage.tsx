import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Brain,
  LockOpen,
  DoorOpen,
  Search,
  Paperclip,
  Image,
  AlertTriangle,
  UserRound,
  MessageCircle,
  Gift,
  ExternalLink,
} from "lucide-react";
import { usePageSession } from "@/hooks/usePageSession";
import { useChats } from "@/hooks/useChats";
import { DEFAULT_LANGUAGE, INTERFACE_LANGUAGES } from "@/lib/languages";
import { Card } from "@/components/ui/card";
import { t } from "@/lib/translations";

const featureKeys = [
  "language_intelligence",
  "independent",
  "privacy",
  "web_search",
  "media",
  "imaging",
  "monitoring",
  "profile",
  "chat_settings",
  "sponsorships",
] as const;

// Map each feature to its icon component
const iconsMap: Record<
  (typeof featureKeys)[number],
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  language_intelligence: Brain,
  independent: LockOpen,
  privacy: DoorOpen,
  web_search: Search,
  media: Paperclip,
  imaging: Image,
  monitoring: AlertTriangle,
  profile: UserRound,
  chat_settings: MessageCircle,
  sponsorships: Gift,
};

export default function FeaturesPage() {
  const { lang_iso_code } = useParams<{ lang_iso_code: string }>();
  const { accessToken } = usePageSession();
  const { chats } = useChats(accessToken?.decoded.sub, accessToken?.raw);
  const language =
    INTERFACE_LANGUAGES.find((lang) => lang.isoCode === lang_iso_code) ||
    DEFAULT_LANGUAGE;
  const botName = import.meta.env.VITE_APP_NAME_SHORT;

  const showNav = Boolean(accessToken);

  const handleProjectClick = () => {
    window.open(import.meta.env.VITE_LANDING_PAGE_URL, "_blank");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        page="features"
        chats={chats}
        userId={accessToken?.decoded?.sub}
        selectedLanguage={language}
        showProfileButton={showNav}
        showSponsorshipsButton={showNav}
        showChatsDropdown={showNav}
        showHelpButton={showNav}
        hasBlockerError={false}
      />

      <main className="flex-1">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-4xl text-center mb-16">
            {t("features.title", { botName })}
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {featureKeys.map((key) => {
              const Icon = iconsMap[key];
              return (
                <Card
                  key={key}
                  className="glass rounded-3xl max-w-md mx-auto px-6 py-8"
                >
                  <div className="flex flex-col items-center space-y-4">
                    <Icon className="h-10 w-10 text-accent-amber" />
                    <h3 className="text-xl font-semibold text-center">
                      {t(`features.items.${key}.title`, { botName })}
                    </h3>
                    <p className="text-m font-light text-center opacity-80">
                      {t(`features.items.${key}.description`, { botName })}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="block h-16" />

          {/* Project button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              className="glass px-4 py-8 text-lg font-medium rounded-full cursor-pointer hover:glass-active hover:text-accent-amber transition-all flex items-center gap-4"
              onClick={handleProjectClick}
            >
              <div className="block h-6" />
              <ExternalLink className="h-8 w-8" />
              {t("check_out_project")}
              <div className="block h-6" />
            </Button>
          </div>

          <div className="block h-16" />
        </div>
      </main>

      <Footer />
    </div>
  );
}
