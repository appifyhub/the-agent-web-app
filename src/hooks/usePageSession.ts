import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { PageError } from "@/lib/utils";
import {
  AccessToken,
  TokenExpiredError,
  TokenMissingError,
} from "@/lib/tokens";

export interface PageSessionState {
  error: PageError | null;
  accessToken: AccessToken | null;
  isLoadingState: boolean;
  setError: (error: PageError | null) => void;
  setIsLoadingState: (loading: boolean) => void;
  handleTokenExpired: () => void;
}

export const usePageSession = (): PageSessionState => {
  const [searchParams] = useSearchParams();
  const [externalError, setError] = useState<PageError | null>(null);
  const [isLoadingState, setIsLoadingState] = useState<boolean>(false);

  const handleTokenExpired = () => {
    console.warn("Settings token expired");
    setError(PageError.blocker("errors.expired"));
  };

  // Parse token and validate, deriving both token and error state
  const { accessToken, tokenError } = useMemo(() => {
    try {
      const rawToken = searchParams.get("token");
      const token = rawToken ? new AccessToken(rawToken) : null;

      // Check if token is expired
      if (token && token.isExpired()) {
        console.warn("Settings token expired");
        return {
          accessToken: null,
          tokenError: PageError.blocker("errors.expired"),
        };
      }

      if (token) {
        console.info("Session parameters are available!", token.decoded);
      }

      return { accessToken: token, tokenError: null };
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        return {
          accessToken: null,
          tokenError: PageError.blocker("errors.expired"),
        };
      } else if (err instanceof TokenMissingError) {
        console.warn("No token found in the URL.");
        return {
          accessToken: null,
          tokenError: PageError.blocker("errors.not_found"),
        };
      } else {
        console.warn("Error decoding token:", err);
        return {
          accessToken: null,
          tokenError: PageError.blocker("errors.not_valid"),
        };
      }
    }
  }, [searchParams]);

  // Use tokenError if present, otherwise use external error
  const error = tokenError || externalError;

  return {
    error,
    accessToken,
    isLoadingState,
    setError,
    setIsLoadingState,
    handleTokenExpired,
  };
};
