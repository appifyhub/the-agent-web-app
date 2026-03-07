import React, { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  title: React.ReactNode;
  description: React.ReactNode;
  genericMessage?: React.ReactNode;
  isBlocker?: boolean;
  onDismiss?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  description,
  genericMessage,
  isBlocker = false,
  onDismiss,
}) => {
  const [progress, setProgress] = useState(100);
  const autoDismissTime = 5000;

  useEffect(() => {
    if (isBlocker || !onDismiss) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / autoDismissTime) * 100);
      setProgress(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 16);

    const timeout = setTimeout(() => {
      onDismiss();
    }, autoDismissTime);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isBlocker, onDismiss]);

  return (
    <div className="max-w-md mx-auto fixed bottom-5 lg:top-30 inset-x-0 px-6 z-50">
      <Alert className="relative space-y-2 py-4 px-6 glass-accent-static shadow-2xl shadow-black/60 rounded-xl overflow-hidden">
        {!isBlocker && onDismiss && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-foreground/10">
            <div
              className="h-full bg-red-300/10 transition-all duration-16 linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <AlertCircle className="text-foreground scale-120" />
        <AlertTitle className="text-[1.04rem] font-bold font-sans text-foreground">
          {title}
        </AlertTitle>
        <AlertDescription className="text-[1.05rem] font-sans text-foreground">
          {description}
          {genericMessage && (
            <>
              <br />
              {genericMessage}
            </>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ErrorMessage;
