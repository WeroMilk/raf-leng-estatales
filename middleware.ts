import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getZonaPorCct } from "@/lib/zonas";

const LOGIN = "/login";

export async function middleware(request: NextRequest) {
  const cookieValue = request.cookies.get("raf_session")?.value ?? request.headers.get("cookie");
  let session = null;
  try {
    session = await getSession(cookieValue);
  } catch {
    session = null;
  }

  if (!session) {
    if (request.nextUrl.pathname === LOGIN) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = LOGIN;
    url.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (session.tipo === "escuela" && session.cct) {
    const path = request.nextUrl.pathname;
    const match = path.match(/^\/(?:escuela|alumno)\/([^/]+)/);
    if (match && match[1] !== session.cct) {
      return NextResponse.redirect(new URL(`/escuela/${session.cct}`, request.url));
    }
    if (path === "/" || path === "/escuelas") {
      return NextResponse.redirect(new URL(`/escuela/${session.cct}`, request.url));
    }
  }

  if (session.tipo === "zona" && session.zona != null) {
    const path = request.nextUrl.pathname;
    const match = path.match(/^\/escuela\/([^/]+)/);
    if (match) {
      const cct = decodeURIComponent(match[1]);
      const zonaEscuela = getZonaPorCct(cct);
      if (zonaEscuela != null && zonaEscuela !== session.zona) {
        return NextResponse.redirect(new URL(`/?zona=${session.zona}`, request.url));
      }
    }
  }

  if (request.nextUrl.pathname === LOGIN) {
    if (session.tipo === "escuela" && session.cct) {
      return NextResponse.redirect(new URL(`/escuela/${session.cct}`, request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|icon|apple-icon|manifest|api|Logtipo_EscudoColor|data/).*)"],
};
