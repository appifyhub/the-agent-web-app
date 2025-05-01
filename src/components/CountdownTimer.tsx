import React, { useState, useEffect, useCallback } from "react";
import { Timer } from "lucide-react"; // Assuming lucide-react is installed
import { cn } from "@/lib/utils"; // For conditional classes

interface CountdownTimerProps {
  expiryTimestamp: number; // Unix timestamp in seconds
  onExpire?: () => void; // Optional callback when timer reaches zero
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  expiryTimestamp,
  onExpire,
}) => {
  const calculateTimeLeft = useCallback(() => {
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const difference = expiryTimestamp - now;
    let timeLeft = { minutes: 0, seconds: 0 };

    if (difference > 0) {
      timeLeft = {
        minutes: Math.floor(difference / 60),
        seconds: Math.floor(difference % 60),
      };
    }
    return { timeLeft, difference };
  }, [expiryTimestamp]); // Dependency is expiryTimestamp

  const [{ timeLeft, difference }, setTimeLeft] = useState(calculateTimeLeft());
  const [isExpired, setIsExpired] = useState(difference <= 0);

  useEffect(() => {
    if (isExpired) return; // Don't start interval if already expired

    const timer = setInterval(() => {
      const { timeLeft: newTimeLeft, difference: newDifference } =
        calculateTimeLeft();
      setTimeLeft({ timeLeft: newTimeLeft, difference: newDifference });

      if (newDifference <= 0) {
        clearInterval(timer);
        setIsExpired(true);
        if (onExpire) {
          onExpire();
        }
      }
    }, 1000);

    // Clear interval on component unmount
    return () => clearInterval(timer);
  }, [expiryTimestamp, onExpire, isExpired, calculateTimeLeft]); // Rerun effect if expiry or callback changes, or if expired status changes

  const formatTime = (time: number): string => {
    return String(time).padStart(2, "0");
  };

  const timeColor = difference < 60 ? "text-destructive" : "text-foreground"; // Red if less than 1 min left

  return (
    <div
      className={cn(
        "flex items-center space-x-2 text-sm font-medium",
        timeColor
      )}
    >
      <Timer className="h-4 w-4" />
      {isExpired ? (
        <span>Expired</span>
      ) : (
        <span>
          {formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
        </span>
      )}
    </div>
  );
};

export default CountdownTimer;
