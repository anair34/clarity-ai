import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "h-9 w-9",
  md: "h-14 w-14",
  lg: "h-16 w-16",
  xl: "h-20 w-20",
};

interface ClarityLogoProps {
  className?: string;
  size?: keyof typeof sizeMap;
  showBackground?: boolean;
}

export function ClarityLogo({
  className,
  size = "sm",
  showBackground = true,
}: ClarityLogoProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn(sizeMap[size], "shrink-0", className)}
    >
      {showBackground && (
        <rect
          width="48"
          height="48"
          rx="14"
          className="fill-[#e8f2e8] dark:fill-[#243524]"
        />
      )}
      <path
        d="M24 10C18 10 14 16 14 22.5C14 29.5 18.5 34 24 38C29.5 34 34 29.5 34 22.5C34 16 30 10 24 10Z"
        className="fill-[#6b8f71]"
      />
      <path
        d="M24 13C20.5 13 17.5 17 17.5 22C17.5 27.5 20.5 32 24 35C27.5 32 30.5 27.5 30.5 22C30.5 17 27.5 13 24 13Z"
        className="fill-[#9fbf9f]"
      />
      <path
        d="M24 16V34"
        className="stroke-[#3f5a42]"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M24 20C21 22 19.5 24.5 19 28"
        className="stroke-[#3f5a42]"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M24 20C27 22 28.5 24.5 29 28"
        className="stroke-[#3f5a42]"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
