import React from "react";
import { twMerge } from "tailwind-merge";

const Button = ({
  children,
  label,
  onClick,
  className,
  secondary,
  ...props
}: {
  children?: React.ReactNode;
  label?: string;
  onClick?: () => void;
  className?: string;
  secondary?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      onClick={onClick}
      className={twMerge(
        "px-4 py-2 bg-[#b74d33] transition-all text-white font-semibold rounded-lg hover:bg-[#ff6c47] outline-none flex items-center justify-center gap-2",
        secondary && 'bg-transparent text-[#b74d33] border border-[#b74d33] hover:text-[#ff6c47] hover:bg-transparent',
        className && className
      )}
      {...props}
    >
      {children || label}
    </button>
  );
};

export default Button;
