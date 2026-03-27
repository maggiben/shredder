/** Claw mark from `docs/claws.svg`; use `onDark` on zinc/black headers, `onLight` on light surfaces. */
const CLAWS_PATH_D =
  "M20.11 16.705h120.31l300.66 207.21 56.39 134-138.88-96-7.06-16.79zM309 423.295l-56.39-134-238.08-164.09v94.45zm-48.47-146.43l10.79 25.64 128.76 89-56.39-134-329.16-226.8v76.64z";

export type ClawsLogoVariant = "onDark" | "onLight";

const variantClass: Record<ClawsLogoVariant, string> = {
  onDark: "text-emerald-400",
  onLight: "text-zinc-900",
};

export function ClawsLogo({
  variant = "onDark",
  className,
  title,
}: {
  variant?: ClawsLogoVariant;
  className?: string;
  /** Optional accessible label; omit when decorative next to visible text. */
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={[variantClass[variant], className].filter(Boolean).join(" ")}
    >
      {title ? <title>{title}</title> : null}
      <path fill="currentColor" d={CLAWS_PATH_D} />
    </svg>
  );
}
