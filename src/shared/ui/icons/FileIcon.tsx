import React from "react";

export default function FileIcon({
  size = 16,
  className = "",
}: { size?: number; className?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      className={className} aria-hidden
    >
      <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" stroke="currentColor" strokeWidth="1.6" fill="none"/>
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.6" fill="none"/>
    </svg>
  );
}
