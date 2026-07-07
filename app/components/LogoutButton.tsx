"use client";

export default function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }
  return (
    <button
      type="button"
      onClick={handleLogout}
      className="btn-ios touch-target inline-flex min-h-[44px] min-w-0 w-full max-w-full items-center justify-center gap-1 rounded-xl bg-red-600 px-2 py-2 text-xs font-medium text-white lg:px-3 lg:text-sm"
      title="Cerrar sesión"
    >
      <svg
        className="size-4 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path d="M10 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" />
        <polyline points="17 7 21 12 17 17" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      <span>Salir</span>
    </button>
  );
}
