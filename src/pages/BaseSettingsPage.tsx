import React from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SettingControls from "@/components/SettingControls";
import TokenSummary from "@/components/TokenSummary";
import ErrorMessage from "@/components/ErrorMessage";
import SettingsPageSkeleton from "@/components/SettingsPageSkeleton";
import GenericPageSkeleton from "@/components/GenericPageSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { DEFAULT_LANGUAGE, INTERFACE_LANGUAGES } from "@/lib/languages";
import { t } from "@/lib/translations";
import { usePageSession } from "@/hooks/usePageSession";
import { ChatInfo } from "@/services/user-settings-service";
import { PageError } from "@/lib/utils";

type Page = "sponsorships" | "profile" | "chat";

interface BaseSettingsPageProps {
  page: Page;
  children: React.ReactNode;
  onActionClicked?: () => void;
  actionDisabled?: boolean;
  showActionButton?: boolean;
  actionButtonText?: string;
  showCancelButton?: boolean;
  onCancelClicked?: () => void;
  cancelDisabled?: boolean;
  isContentLoading?: boolean;
  selectedChat?: ChatInfo;
  showProfileButton?: boolean;
  showSponsorshipsButton?: boolean;
  externalError?: PageError | null;
}

const BaseSettingsPage: React.FC<BaseSettingsPageProps> = ({
  page,
  children,
  onActionClicked = () => {},
  actionDisabled = false,
  showActionButton = true,
  actionButtonText,
  showCancelButton = false,
  onCancelClicked = () => {},
  cancelDisabled = false,
  isContentLoading = false,
  selectedChat,
  showProfileButton = true,
  showSponsorshipsButton = true,
  externalError = null,
}) => {
  const { lang_iso_code, user_id, chat_id } = useParams<{
    lang_iso_code: string;
    user_id?: string;
    chat_id?: string;
  }>();

  const { error, accessToken, isLoadingState, chats, handleTokenExpired } =
    usePageSession(user_id, chat_id);

  // prioritize external error if provided
  const displayError = externalError || error;
  const getErrorText = (error: PageError | null): string | React.ReactNode => {
    if (!error?.errorData) return "";
    if (error.errorData.htmlContent) {
      return error.errorData.htmlContent;
    }
    return t(error.errorData.translationKey, error.errorData.variables || {});
  };

  // show the early loading state
  if (!accessToken && !error) {
    console.info("Rendering the loading state!");
    return (
      <div className="container mx-auto p-4 h-screen">
        <div className="flex flex-col items-center space-y-6 h-full justify-center p-9">
          <GenericPageSkeleton />
        </div>
      </div>
    );
  }

  // render the main content
  return (
    <div className="flex flex-col min-h-screen">
      {/* The Header section */}
      <Header
        page={page}
        chats={chats}
        selectedChat={
          selectedChat || chats.find((chat) => chat.chat_id === chat_id)
        }
        selectedLanguage={
          INTERFACE_LANGUAGES.find((lang) => lang.isoCode === lang_iso_code) ||
          DEFAULT_LANGUAGE
        }
        hasBlockerError={!!displayError?.isBlocker}
        userId={accessToken?.decoded?.sub}
        showProfileButton={showProfileButton}
        showSponsorshipsButton={showSponsorshipsButton}
      />

      {/* The Main content section */}
      <div className="flex-1 mx-auto w-full max-w-3xl">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <main>
            {/* The Session Expiry timer and Save button */}
            <SettingControls
              expiryTimestamp={accessToken?.decoded?.exp || 0}
              onTokenExpired={handleTokenExpired}
              onActionClicked={onActionClicked}
              actionDisabled={
                actionDisabled || isLoadingState || !!displayError?.isBlocker
              }
              showActionButton={showActionButton}
              actionButtonText={actionButtonText}
              showCancelButton={showCancelButton}
              onCancelClicked={onCancelClicked}
              cancelDisabled={
                cancelDisabled || isLoadingState || !!displayError?.isBlocker
              }
            />

            {/* The Settings card */}
            <Card className="mt-4.5 md:px-6 px-2 md:py-12 py-8 glass-static rounded-3xl">
              <CardContent className="space-y-4">
                {isLoadingState || isContentLoading ? (
                  <SettingsPageSkeleton />
                ) : (
                  children
                )}
              </CardContent>
            </Card>

            {/* Spacer */}
            <div className="h-4" />

            {/* Token Information */}
            <div className="text-xs mb-9 text-blue-300/30">
              {accessToken && <TokenSummary decoded={accessToken.decoded} />}
            </div>
          </main>
        </div>
      </div>

      {displayError && (
        <ErrorMessage
          title={t("errors.oh_no")}
          description={getErrorText(displayError)}
          genericMessage={
            displayError?.showGenericAppendix
              ? t("errors.check_link")
              : undefined
          }
        />
      )}

      <Footer />
    </div>
  );
};

export default BaseSettingsPage;
