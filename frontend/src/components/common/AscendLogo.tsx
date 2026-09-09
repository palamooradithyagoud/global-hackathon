"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

interface AscendLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  variant?: "horizontal" | "stacked" | "icon" | "badge";
  showText?: boolean;
  className?: string;
  withLink?: boolean;
  href?: string;
}

export default function AscendLogo({
  size = "md",
  variant = "horizontal",
  showText = true,
  className = "",
  withLink = false,
  href = "/",
}: AscendLogoProps) {
  // Dimensions mapping
  const dimensions = {
    xs: { icon: 20, text: "text-xs tracking-[0.2em]" },
    sm: { icon: 26, text: "text-sm tracking-[0.22em]" },
    md: { icon: 34, text: "text-base tracking-[0.25em]" },
    lg: { icon: 44, text: "text-xl tracking-[0.28em]" },
    xl: { icon: 60, text: "text-2xl tracking-[0.3em]" },
    "2xl": { icon: 84, text: "text-4xl tracking-[0.32em]" },
  }[size];

  const iconElement = (
    <div
      className="relative flex items-center justify-center shrink-0 group select-none"
      style={{ width: dimensions.icon, height: dimensions.icon }}
    >
      {/* Subtle ambient glow behind the logo */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/20 via-violet-500/20 to-transparent blur-md group-hover:scale-125 transition-transform duration-500 opacity-80" />

      {/* High-res optimized Ascend Icon */}
      <Image
        src="/ascend-icon.png"
        alt="ASCEND Logo"
        width={dimensions.icon * 2}
        height={dimensions.icon * 2}
        className="w-full h-full object-contain relative z-10 drop-shadow-[0_2px_10px_rgba(251,191,36,0.2)]"
        priority
      />
    </div>
  );

  const textElement = showText && (
    <div className="flex flex-col select-none">
      <span
        className={`font-black font-sans uppercase text-white drop-shadow-sm flex items-center ${dimensions.text}`}
        style={{ letterSpacing: "0.26em" }}
      >
        {/* Stylized geometric typography with crossbar-less A matching the logo */}
        <span className="text-amber-400 mr-[1px]">Λ</span>SCEND
      </span>
      {size === "xl" || size === "2xl" ? (
        <span className="text-[10px] tracking-[0.25em] text-[#8E8E9C] font-semibold uppercase -mt-0.5">
          Student Career Intelligence
        </span>
      ) : null}
    </div>
  );

  const content = (() => {
    if (variant === "icon") {
      return iconElement;
    }

    if (variant === "badge") {
      return (
        <div
          className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-[#14141E]/90 border border-[#2B2B3C] shadow-lg backdrop-blur-md ${className}`}
        >
          {iconElement}
          {textElement}
        </div>
      );
    }

    if (variant === "stacked") {
      return (
        <div className={`flex flex-col items-center text-center gap-3 ${className}`}>
          {iconElement}
          {textElement}
        </div>
      );
    }

    // Default horizontal
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {iconElement}
        {textElement}
      </div>
    );
  })();

  if (withLink) {
    return (
      <Link href={href} className="group inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
