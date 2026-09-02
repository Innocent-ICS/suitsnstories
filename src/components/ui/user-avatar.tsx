"use client";

import { useState } from "react";
import Image from "next/image";
import { UserIcon } from "@/components/icons/app-icons";

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

  const showImage = src && !imgError && isSupportedAvatarUrl(src);

  if (showImage) {
    return (
      <span className={`relative block shrink-0 overflow-hidden rounded-full ${sizeClasses[size]} ${className}`}>
        <Image
          src={src}
          alt={name || "User"}
          fill
          sizes={size === "lg" ? "56px" : size === "md" ? "40px" : "32px"}
          onError={() => setImgError(true)}
          className="object-cover"
        />
      </span>
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

function isSupportedAvatarUrl(src: string) {
  if (src.startsWith("/")) return true;

  try {
    const url = new URL(src);
    return (
      url.protocol === "https:" &&
      (url.hostname === "lh3.googleusercontent.com" ||
        url.hostname.endsWith(".googleusercontent.com") ||
        url.hostname.endsWith(".supabase.co"))
    );
  } catch {
    return false;
  }
}
