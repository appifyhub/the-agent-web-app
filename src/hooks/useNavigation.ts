import { useNavigate, useSearchParams } from "react-router-dom";

export interface NavigationHelpers {
  navigateToChat: (chatId: string, langIsoCode: string) => void;
  navigateToProfile: (userId: string, langIsoCode: string) => void;
  navigateToAccess: (userId: string, langIsoCode: string) => void;
  navigateToIntelligence: (userId: string, langIsoCode: string) => void;
  navigateToSponsorships: (userId: string, langIsoCode: string) => void;
  navigateToConnections: (userId: string, langIsoCode: string) => void;
  navigateToUsage: (userId: string, langIsoCode: string) => void;
  navigateToPurchases: (userId: string, langIsoCode: string) => void;
  navigateToFeatures: (langIsoCode: string) => void;
  navigateWithLanguageChange: (
    langIsoCode: string,
    currentPath: string
  ) => void;
}

export const useNavigation = (): NavigationHelpers => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Preserve all search params except 'token'
  const getPreservedSearchParams = (): string => {
    const preserved = new URLSearchParams(searchParams);
    preserved.delete("token");
    const search = preserved.toString();
    return search ? `?${search}` : "";
  };

  const navigateToChat = (chatId: string, langIsoCode: string) => {
    console.info("Navigating to chat:", chatId);
    navigate(`/${langIsoCode}/chat/${chatId}/settings${getPreservedSearchParams()}`);
  };

  const navigateToProfile = (userId: string, langIsoCode: string) => {
    console.info("Navigating to profile:", userId);
    navigate(`/${langIsoCode}/user/${userId}/settings${getPreservedSearchParams()}`);
  };

  const navigateToAccess = (userId: string, langIsoCode: string) => {
    console.info("Navigating to access:", userId);
    navigate(`/${langIsoCode}/user/${userId}/access${getPreservedSearchParams()}`);
  };

  const navigateToIntelligence = (userId: string, langIsoCode: string) => {
    console.info("Navigating to intelligence:", userId);
    navigate(`/${langIsoCode}/user/${userId}/intelligence${getPreservedSearchParams()}`);
  };

  const navigateToSponsorships = (userId: string, langIsoCode: string) => {
    console.info("Navigating to sponsorships:", userId);
    navigate(`/${langIsoCode}/user/${userId}/sponsorships${getPreservedSearchParams()}`);
  };

  const navigateToConnections = (userId: string, langIsoCode: string) => {
    console.info("Navigating to connections:", userId);
    navigate(`/${langIsoCode}/user/${userId}/connections${getPreservedSearchParams()}`);
  };

  const navigateToUsage = (userId: string, langIsoCode: string) => {
    console.info("Navigating to usage:", userId);
    navigate(`/${langIsoCode}/user/${userId}/usage${getPreservedSearchParams()}`);
  };

  const navigateToPurchases = (userId: string, langIsoCode: string) => {
    console.info("Navigating to purchases:", userId);
    navigate(`/${langIsoCode}/user/${userId}/purchases${getPreservedSearchParams()}`);
  };

  const navigateToFeatures = (langIsoCode: string) => {
    console.info("Navigating to features");
    navigate(`/${langIsoCode}/features${getPreservedSearchParams()}`);
  };

  const navigateWithLanguageChange = (
    langIsoCode: string,
    currentPath: string
  ) => {
    console.info("Interface language changed to:", langIsoCode);

    // Replace the language code in the current path
    const pathSegments = currentPath.split("/").filter(Boolean);
    if (pathSegments.length > 0) {
      pathSegments[0] = langIsoCode; // Replace the first segment (language code)
      const newPath = `/${pathSegments.join("/")}${getPreservedSearchParams()}`;
      navigate(newPath);
    } else {
      console.warn("Cannot navigate - invalid path structure");
    }
  };

  return {
    navigateToChat,
    navigateToProfile,
    navigateToAccess,
    navigateToIntelligence,
    navigateToSponsorships,
    navigateToConnections,
    navigateToUsage,
    navigateToPurchases,
    navigateToFeatures,
    navigateWithLanguageChange,
  };
};
