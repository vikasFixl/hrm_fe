import clsx from "clsx";

type AvatarSize = "sm" | "md" | "lg" | "xl";

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string;
  size?: AvatarSize;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={clsx("avatar", `avatar-${size}`, className)}
        style={{ objectFit: "cover" }}
      />
    );
  }

  return (
    <span className={clsx("avatar", `avatar-${size}`, className)} title={name}>
      {initials}
    </span>
  );
}
