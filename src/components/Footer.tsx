import { t } from "@/lib/translations";
import logoVector from "@/assets/logo-vector.svg";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const yearRange = currentYear > 2024 ? `2024 - ${currentYear}` : "2024";

  return (
    <footer className="mt-auto border-t border-indigo-100/10 bg-background/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col items-center space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-8">
          {/* Brand section */}
          <div className="flex items-center">
            <a href={import.meta.env.VITE_LANDING_PAGE_URL}>
              <img 
                width="24" 
                height="24" 
                src={logoVector} 
                alt={t("footer.logo_alt")}
                className="opacity-80 hover:opacity-100 transition-opacity"
              />
            </a>
          </div>

          {/* Links section */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs">
            <a 
              href="https://www.appifyhub.com/terms.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground/70 hover:text-accent-amber transition-colors"
            >
              {t("footer.terms")}
            </a>
            <a 
              href="https://www.appifyhub.com/privacy.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground/70 hover:text-accent-amber transition-colors"
            >
              {t("footer.privacy")}
            </a>
            <span className="text-muted-foreground/70">
              {t("footer.powered_by")} <a 
                href="https://www.appifyhub.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-accent-amber transition-colors"
              >
                Appify Hub
              </a>
            </span>
          </div>

          {/* Copyright */}
          <div className="text-xs text-muted-foreground/70 md:ml-auto">
            {yearRange} © Appify Hub · {t("footer.rights_reserved")}
          </div>
        </div>
      </div>
    </footer>
  );
}
