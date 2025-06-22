import { useNavigate } from "react-router-dom";

export interface NavigationHelpers {
  navigateToChat: (chatId: string, langIsoCode: string) => void;
  navigateToProfile: (userId: string, langIsoCode: string) => void;
  navigateToSponsorships: (userId: string, langIsoCode: string) => void;
  navigateWithLanguageChange: (
    langIsoCode: string,
    currentPath: string
  ) => void;
}

export const useNavigation = (): NavigationHelpers => {
  const navigate = useNavigate();

  const preserveSearchParams = () => {
    return window.location.search;
  };

  const navigateToChat = (chatId: string, langIsoCode: string) => {
    const search = preserveSearchParams();
    console.info("Navigating to chat:", chatId);
    navigate(`/${langIsoCode}/chat/${chatId}/settings${search}`);
  };

  const navigateToProfile = (userId: string, langIsoCode: string) => {
    const search = preserveSearchParams();
    console.info("Navigating to profile:", userId);
    navigate(`/${langIsoCode}/user/${userId}/settings${search}`);
  };

  const navigateToSponsorships = (userId: string, langIsoCode: string) => {
    const search = preserveSearchParams();
    console.info("Navigating to sponsorships:", userId);
    navigate(`/${langIsoCode}/user/${userId}/sponsorships${search}`);
  };

  const navigateWithLanguageChange = (
    langIsoCode: string,
    currentPath: string
  ) => {
    const search = preserveSearchParams();
    console.info("Interface language changed to:", langIsoCode);

    // Replace the language code in the current path
    const pathSegments = currentPath.split("/").filter(Boolean);
    if (pathSegments.length > 0) {
      pathSegments[0] = langIsoCode; // Replace the first segment (language code)
      const newPath = `/${pathSegments.join("/")}${search}`;
      navigate(newPath);
    } else {
      console.warn("Cannot navigate - invalid path structure");
    }
  };

  return {
    navigateToChat,
    navigateToProfile,
    navigateToSponsorships,
    navigateWithLanguageChange,
  };
};
