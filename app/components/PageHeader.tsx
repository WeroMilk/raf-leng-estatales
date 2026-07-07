import LogoSonoraSec from "./LogoSonoraSec";

/**
 * Header consistente: título + meta a la izquierda, selector centrado (desktop) o debajo (móvil), logo a la derecha.
 */
export default function PageHeader({
  children,
  centerContent,
  meta,
}: {
  children: React.ReactNode;
  centerContent?: React.ReactNode;
  meta?: React.ReactNode;
}) {
  const hasCenter = Boolean(centerContent);

  return (
    <header
      className={[
        "page-header shrink-0 py-1.5 sm:py-2",
        hasCenter ? "page-header--with-center" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="page-header__top">
        <div className="page-header__stack">
          <div className="page-header__content">{children}</div>
          {meta && <div className="page-header__meta">{meta}</div>}
        </div>
        <div className="page-header__logo shrink-0">
          <LogoSonoraSec maxWidth={240} className="hidden sm:block" variant="header" />
          <LogoSonoraSec maxWidth={120} className="sm:hidden" variant="header" />
        </div>
      </div>
      {centerContent && (
        <div className="page-header__center min-w-0">{centerContent}</div>
      )}
    </header>
  );
}
