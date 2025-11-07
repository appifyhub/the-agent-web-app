import React from "react";
import { CardTitle } from "@/components/ui/card";
import BaseSettingsPage from "@/pages/BaseSettingsPage";
import { t } from "@/lib/translations";
import { usePageSession } from "@/hooks/usePageSession";

const UserSettingsPage: React.FC = () => {
  const { error, isLoadingState } = usePageSession();

  const botName = import.meta.env.VITE_APP_NAME_SHORT;

  return (
    <BaseSettingsPage
      page="profile"
      actionDisabled={true}
      showActionButton={false}
      isContentLoading={isLoadingState}
      externalError={error}
    >
      <div className="h-2" />
      <CardTitle className="text-center mx-auto">
        {t("profile_card_title", { botName })}
      </CardTitle>

      <div className="h-8" />
    </BaseSettingsPage>
  );
};

export default UserSettingsPage;
