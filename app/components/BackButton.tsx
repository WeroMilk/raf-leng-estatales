import Link from "next/link";

interface Props {
  href: string;
  label: string;
}

export default function BackButton({ href, label }: Props) {
  return (
    <Link
      href={href}
      className="btn-ios btn-sonora touch-target mb-1 inline-flex min-h-[44px] items-center gap-1 self-start rounded-xl px-3 py-2 text-sm font-medium text-white"
    >
      ← {label}
    </Link>
  );
}
