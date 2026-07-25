import { useState, useEffect } from "react";
import { getGravatarUrl } from "@/utils/getGravatarUrl";

interface Props {
  /** Explicit uploaded image URL (profileImage, tenant.avatarUrl, etc.), highest priority. */
  src?:   string | null;
  /** Used for the Gravatar fallback, and to derive an initial if name isn't given. */
  email?: string | null;
  /** Used for the initials fallback and derives the initial when email is the only thing available. */
  name?:  string | null;
  size?:  number;
  className?: string;
}

export default function Avatar({ src, email, name, size = 40, className = "" }: Props) {
  const gravatarUrl = getGravatarUrl(email ?? "essienedidiong@gmail.com", size * 2); // 2x for retina
  const imageUrl = src || gravatarUrl;

  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [imageUrl]);

  const initial = (name?.trim()?.charAt(0) || email?.trim()?.charAt(0) || "?").toUpperCase();

  if (imageUrl && !failed) {
    return (
      <img
        src={imageUrl}
        alt={name ?? ""}
        onError={() => setFailed(true)}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  console.log(gravatarUrl)

  return (
    <span
      className={`rounded-full flex items-center justify-center shrink-0 bold ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        backgroundColor: "var(--color-ink, #17191c)",
        color: "var(--color-canvas, #fff)",
      }}
    >
      {initial}
    </span>
  );
}