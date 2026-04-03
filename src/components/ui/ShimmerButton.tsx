import React from 'react';

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  shimmerDuration?: string;
  borderRadius?: string;
  background?: string;
  className?: string;
  children: React.ReactNode;
}

export const ShimmerButton = ({
  shimmerColor = "#ffffff",
  shimmerSize = "0.1em",
  shimmerDuration = "2s",
  borderRadius = "100px",
  background = "rgba(0, 0, 0, 1)",
  className = "",
  children,
  ...props
}: ShimmerButtonProps) => {
  return (
    <button
      className={`group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-white/10 px-6 py-3 text-white [background:var(--bg)] [border-radius:var(--radius)] transition-transform duration-300 active:scale-95 ${className}`}
      style={{
        "--radius": borderRadius,
        "--bg": background,
      } as React.CSSProperties}
      {...props}
    >
      {/* spark container */}
      <div className="absolute inset-0 z-[-1] [container-type:size]">
        {/* spark */}
        <div className="absolute inset-0 h-[100cqh] animate-shimmer-slide [aspect-ratio:1] [background:conic-gradient(from_0deg,transparent_0_340deg,var(--shimmer-color)_360deg)] [mask:linear-gradient(white,transparent_50%)]" 
             style={{ "--shimmer-color": shimmerColor } as React.CSSProperties}
        />
      </div>
      {children}

      {/* Backdrop */}
      <div className="absolute inset-[2px] z-[-1] rounded-[inherit] [background:var(--bg)]" />
    </button>
  );
};
