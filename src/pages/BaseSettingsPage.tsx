import React, { useState, useImperativeHandle, forwardRef } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SettingActionBar from "@/components/SettingActionBar";
import TokenSummary from "@/components/TokenSummary";
import ErrorMessage from "@/components/ErrorMessage";
import SettingsPageSkeleton from "@/components/SettingsPageSkeleton";
import GenericPageSkeleton from "@/components/GenericPageSkeleton";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { DEFAULT_LANGUAGE, INTERFACE_LANGUAGES } from "@/lib/languages";
import { t } from "@/lib/translations";
import { usePageSession } from "@/hooks/usePageSession";
import { useChats } from "@/hooks/useChats";
import { ChatInfo } from "@/services/user-settings-service";
import { PageError, cn } from "@/lib/utils";

type Page =
  | "sponsorships"
  | "profile"
  | "chat"
  | "access"
  | "intelligence"
  | "connections"
  | "usage"
  | "purchases";

export interface BaseSettingsPageRef {
  openDrawer: () => void;
}

interface BaseSettingsPageProps {
  page: Page;
  children: React.ReactNode;
  cardTitle?: string;
  onActionClicked?: () => void;
  actionDisabled?: boolean;
  showActionButton?: boolean;
  actionIcon?: React.ReactNode;
  actionButtonText?: string;
  showSecondaryButton?: boolean;
  onSecondaryClicked?: () => void;
  secondaryDisabled?: boolean;
  secondaryIcon?: React.ReactNode;
  secondaryText?: string;
  secondaryTooltipText?: string;
  secondaryClassName?: string;
  showCancelButton?: boolean;
  onCancelClicked?: () => void;
  cancelDisabled?: boolean;
  cancelIcon?: React.ReactNode;
  cancelTooltipText?: string;
  isContentLoading?: boolean;
  selectedChat?: ChatInfo;
  showProfileButton?: boolean;
  showSponsorshipsButton?: boolean;
  externalError?: PageError | null;
  cardClassName?: string;
}

const BaseSettingsPage = forwardRef<BaseSettingsPageRef, BaseSettingsPageProps>(
  (
    {
      page,
      children,
      cardTitle,
      onActionClicked = () => {},
      actionDisabled = false,
      showActionButton = true,
      actionIcon,
      actionButtonText,
      showSecondaryButton = false,
      onSecondaryClicked = () => {},
      secondaryDisabled = false,
      secondaryIcon,
      secondaryText,
      secondaryTooltipText,
      secondaryClassName,
      showCancelButton = false,
      onCancelClicked = () => {},
      cancelDisabled = false,
      cancelIcon,
      cancelTooltipText,
      isContentLoading = false,
      selectedChat,
      showProfileButton = true,
      showSponsorshipsButton = true,
      externalError = null,
      cardClassName,
    },
    ref,
  ) => {
    const { lang_iso_code } = useParams<{
      lang_iso_code: string;
      user_id?: string;
      chat_id?: string;
    }>();

    const { error, accessToken, isLoadingState, handleTokenExpired } =
      usePageSession();

    // Fetch chats once at this level to avoid duplicate calls
    const { chats } = useChats(accessToken?.decoded?.sub, accessToken?.raw);

    const [drawerOpen, setDrawerOpen] = useState(false);

    useImperativeHandle(ref, () => ({
      openDrawer: () => setDrawerOpen(true),
    }));

    // prioritize external error if provided
    const displayError = externalError || error;
    const getErrorText = (
      error: PageError | null,
    ): string | React.ReactNode => {
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
          selectedChat={selectedChat}
          chats={chats}
          userId={accessToken?.decoded?.sub}
          rawAccessToken={accessToken?.raw}
          selectedLanguage={
            INTERFACE_LANGUAGES.find(
              (lang) => lang.isoCode === lang_iso_code,
            ) || DEFAULT_LANGUAGE
          }
          hasBlockerError={!!displayError?.isBlocker}
          showProfileButton={showProfileButton}
          showSponsorshipsButton={showSponsorshipsButton}
          drawerOpen={drawerOpen}
          onDrawerOpenChange={setDrawerOpen}
        />

        {/* The Main content section */}
        <div className="flex-1 mx-auto w-full max-w-4xl">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <main>
              {/* The Session Expiry timer and Action buttons */}
              <SettingActionBar
                expiryTimestamp={accessToken?.decoded?.exp || 0}
                onTokenExpired={handleTokenExpired}
                onActionClicked={onActionClicked}
                actionDisabled={
                  actionDisabled || isLoadingState || !!displayError?.isBlocker
                }
                showActionButton={showActionButton}
                actionIcon={actionIcon}
                actionButtonText={actionButtonText}
                showSecondaryButton={showSecondaryButton}
                onSecondaryClicked={onSecondaryClicked}
                secondaryDisabled={
                  secondaryDisabled || isLoadingState || !!displayError?.isBlocker
                }
                secondaryIcon={secondaryIcon}
                secondaryText={secondaryText}
                secondaryTooltipText={secondaryTooltipText}
                secondaryClassName={secondaryClassName}
                showCancelButton={showCancelButton}
                onCancelClicked={onCancelClicked}
                cancelDisabled={
                  cancelDisabled || isLoadingState || !!displayError?.isBlocker
                }
                cancelIcon={cancelIcon}
                cancelTooltipText={cancelTooltipText}
              />

              {/* The Settings card */}
              <Card
                className={cn(
                  "mt-4.5 md:px-6 px-2 md:py-12 py-8 glass-static rounded-3xl",
                  cardClassName,
                )}
              >
                <CardContent className="space-y-4">
                  {isLoadingState || isContentLoading ? (
                    <SettingsPageSkeleton />
                  ) : (
                    <>
                      {cardTitle && (
                        <>
                          <CardTitle className="text-center mx-auto">
                            {cardTitle}
                          </CardTitle>
                          <div className="h-4" />
                        </>
                      )}
                      {children}
                    </>
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
  },
);

BaseSettingsPage.displayName = "BaseSettingsPage";

export default BaseSettingsPage;
