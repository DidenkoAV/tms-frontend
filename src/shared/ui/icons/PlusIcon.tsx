import React from "react";

export default function PlusIcon({
  size = 14,
  className = "",
}: { size?: number; className?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      className={className} aria-hidden
    >
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
