import React from "react";

interface TelegramIconProps {
  className?: string;
}

const TelegramIcon: React.FC<TelegramIconProps> = ({
  className = "h-4 w-4",
}) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6.967,14.357L0.864,10.703L23.006,2.103L19.017,22.259C19.017,22.259 10.931,17.106 9.627,16.053C9.473,15.928 12.639,18.129 12.639,18.129L9.638,21.678L9.627,16.053L17.818,8.063L6.967,14.357Z" />
    </svg>
  );
};

export default TelegramIcon;
