import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  expiryTimestamp: number;
  onExpire?: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  expiryTimestamp,
  onExpire,
}) => {
  const calculateTimeLeft = useCallback(() => {
    const now = Math.floor(Date.now() / 1000);
    const deltaSeconds = expiryTimestamp - now;
    let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

    if (deltaSeconds > 0) {
      timeLeft = {
        days: Math.floor(deltaSeconds / (60 * 60 * 24)),
        hours: Math.floor((deltaSeconds % (60 * 60 * 24)) / (60 * 60)),
        minutes: Math.floor((deltaSeconds % (60 * 60)) / 60),
        seconds: Math.floor(deltaSeconds % 60),
      };
    }
    return { timeLeft, deltaSeconds };
  }, [expiryTimestamp]);

  const [{ timeLeft, deltaSeconds }, setTimeLeft] = useState(
    calculateTimeLeft()
  );
  const [isExpired, setIsExpired] = useState(deltaSeconds <= 0);

  useEffect(() => {
    if (isExpired) return;

    const timer = setInterval(() => {
      const { timeLeft: newTimeLeft, deltaSeconds: newDeltaSeconds } =
        calculateTimeLeft();
      setTimeLeft({ timeLeft: newTimeLeft, deltaSeconds: newDeltaSeconds });

      if (newDeltaSeconds <= 0) {
        clearInterval(timer);
        setIsExpired(true);
        if (onExpire) {
          onExpire();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryTimestamp, onExpire, isExpired, calculateTimeLeft]);

  const formatCountdown = () => {
    const formatTime = (time: number): string => {
      return String(time).padStart(2, "0");
    };

    const { days, hours, minutes, seconds } = timeLeft;
    const parts = [];
    if (days > 0) {
      parts.push(`☀️ ${days}\u00A0`);
    }
    parts.push("⏱️");
    if (hours > 0) {
      parts.push(formatTime(hours));
    }
    if (minutes > 0) {
      if (hours > 0) {
        parts.push(":");
      }
      parts.push(formatTime(minutes));
    }
    if ((hours > 0 || minutes > 0) && seconds >= 0) {
      parts.push(":");
    }
    parts.push(formatTime(seconds));
    return parts.join(" ").replace(/ : /g, ":");
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center px-6 py-3 text-[1.05rem] border rounded-full",
        deltaSeconds <= 60
          ? "border-destructive text-destructive"
          : deltaSeconds <= 180
          ? "border-orange-300 text-orange-300"
          : "border-foreground/20 text-foreground"
      )}
    >
      {isExpired ? <span>⛓️‍💥</span> : <span>{formatCountdown()}</span>}
    </div>
  );
};

export default CountdownTimer;
