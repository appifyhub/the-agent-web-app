import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  title: React.ReactNode;
  description: React.ReactNode;
  genericMessage?: React.ReactNode;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  description,
  genericMessage,
}) => (
  <div className="max-w-md mx-auto fixed bottom-10 lg:top-10 inset-x-0 px-6 z-50">
    <Alert className="space-y-2 bg-accent-dark border-accent-strong border shadow-xl rounded-xl">
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

export default ErrorMessage;
