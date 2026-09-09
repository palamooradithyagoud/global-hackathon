"use client";

import React from "react";

interface AiAssistantIconProps {
  className?: string;
  size?: number;
  isActive?: boolean;
}

export default function AiAssistantIcon({
  className = "",
  size = 24,
  isActive = false,
}: AiAssistantIconProps) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 transition-transform duration-200 ${className}`}
    >
      <img
        src="/ascend-ai-avatar.png"
        alt="Ascend AI Assistant"
        className="w-full h-full object-cover rounded-full select-none"
      />
      {isActive && (
        <div className="absolute inset-0 rounded-full ring-2 ring-[#22D3EE] shadow-[0_0_10px_#22D3EE] pointer-events-none" />
      )}
    </div>
  );
}

