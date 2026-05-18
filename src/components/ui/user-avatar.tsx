"use client";

import { useState } from "react";
import { UserIcon } from "@heroicons/react/24/solid";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
};

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

export function UserAvatar({ src, name, size = "sm", className = "" }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const showImage = src && !imgError;

  if (showImage) {
    return (
      <img
        src={src}
        alt={name || "User"}
        onError={() => setImgError(true)}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-primary/10 flex items-center justify-center shrink-0 ${className}`}
    >
      <UserIcon className={`${iconSizes[size]} text-primary/60`} />
    </div>
  );
}
