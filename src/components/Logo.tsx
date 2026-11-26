import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ size = "md", className = "" }: LogoProps) {
  const sizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <Link
      href="/"
      aria-label="jedi.mov home"
      className={`group inline-flex items-baseline gap-0.5 font-semibold tracking-tight select-none ${sizes[size]} ${className}`}
    >
      <span className="text-[var(--text-primary)] transition-colors">
        jedi
      </span>
      <span
        className="font-mono font-medium text-[var(--accent)] transition-colors group-hover:text-[var(--accent-secondary)]"
        aria-hidden="true"
      >
        .mov
      </span>
      <span
        className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-secondary)] opacity-85 transition-transform duration-300 group-hover:scale-125"
        aria-hidden="true"
      />
    </Link>
  );
}
