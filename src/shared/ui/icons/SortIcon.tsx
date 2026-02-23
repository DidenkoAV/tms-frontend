import React from "react";

export default function SortIcon({
  size = 14,
  className = "",
}: { size?: number; className?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      className={className} aria-hidden
    >
      <path d="M8 5v14M8 19l-2-2m2 2l2-2M16 5l2 2m-2-2l-2 2M16 5v14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
