import messagepointLogo from "@/public/logos/logo.svg";

export function Logo({ size = 32, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 select-none">
      {/* Light theme - purple logo */}
      <img
        src={messagepointLogo}
        alt="Messagepoint Logo"
        style={{ width: size, height: size }}
        className="rounded-md shadow-sm dark:hidden"
      />
      {/* Dark theme - white logo */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        className="hidden rounded-md shadow-sm dark:block"
        aria-hidden="true"
      >
        <g transform="translate(-165 -52)" fill="#ffffff">
          <path d="m189 52c13.255 0 24 10.745 24 24s-10.745 24-24 24-24-10.745-24-24 10.745-24 24-24zm13 11l-12.792 9.8003-13.208-9.7817v25.981h5.8113v-14.633l7.3971 5.5031 12.792-9.5903v-7.2798zm-6 26h6v-5h-6v5z"/>
        </g>
      </svg>
      {withWordmark && (
        <>
          {/* Light theme - black text */}
          <span className="leading-none dark:hidden">
            <span className="text-[17px] font-semibold tracking-tight text-slate-900">
              Messagepoint
            </span>
            <span className="ml-[6px] text-[17px] font-semibold tracking-tight text-slate-900">
              TMS
            </span>
          </span>
          {/* Dark theme - white text */}
          <span className="hidden leading-none dark:inline">
            <span className="text-[17px] font-semibold tracking-tight text-white">Messagepoint</span>
            <span className="ml-[6px] text-[17px] font-semibold tracking-tight text-white">
              TMS
            </span>
          </span>
        </>
      )}
    </span>
  );
}

