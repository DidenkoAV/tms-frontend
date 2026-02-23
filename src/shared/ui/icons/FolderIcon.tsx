import React from "react";

export default function FolderIcon({
  size = 18,
  className = "",
}: { size?: number; className?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      className={className} aria-hidden
    >
      <path d="M3 7.5a2.5 2.5 0 012.5-2.5h3l2 2h7A2.5 2.5 0 0120 9.5v7A2.5 2.5 0 0117.5 19h-12A2.5 2.5 0 013 16.5v-9z" stroke="currentColor" strokeWidth="1.6" fill="none"/>
    </svg>
  );
}
