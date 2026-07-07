import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth-data";
import { createSessionCookie, getSessionCookieName, hasValidAuthSecret } from "@/lib/auth";

export const runtime = "nodejs";

function normalizePassword(s: string): string {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "");
}

function getPasswordFromRequest(request: Request): Promise<string> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    return request.formData().then((form) => {
      const p = form.get("password");
      return typeof p === "string" ? normalizePassword(p) : "";
    });
  }
  if (contentType.includes("application/json")) {
    return request.json().then((body: { password?: string }) =>
      typeof body?.password === "string" ? normalizePassword(body.password) : ""
    );
  }
  return Promise.resolve("");
}

function wantsJson(request: Request): boolean {
  return (request.headers.get("accept") ?? "").includes("application/json");
}

function setSessionCookie(res: NextResponse, value: string) {
  res.cookies.set(getSessionCookieName(), value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
}

export async function POST(request: Request) {
  const json = wantsJson(request);
  const baseUrl = new URL(request.url).origin;

  try {
    if (!hasValidAuthSecret()) {
      if (json) {
        return NextResponse.json(
          { ok: false, error: "auth_secret_required" },
          { status: 200 }
        );
      }
      return NextResponse.redirect(
        new URL("/login?error=server&msg=auth_secret_required", request.url),
        302
      );
    }
    const password = await getPasswordFromRequest(request);
    if (!password) {
      if (json) return NextResponse.json({ ok: false, error: "empty" }, { status: 200 });
      return NextResponse.redirect(new URL("/login?error=empty", request.url), 302);
    }
    const session = verifyPassword(password);
    if (!session) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[login] Contraseña no coincide con superUsuario ni con ninguna escuela en auth-data.json");
      }
      if (json) return NextResponse.json({ ok: false, error: "invalid" }, { status: 200 });
      return NextResponse.redirect(new URL("/login?error=invalid", request.url), 302);
    }
    if (process.env.NODE_ENV === "development") {
      console.log("[login] OK tipo:", session.tipo, session.cct ?? "");
    }
    const value = await createSessionCookie(session);
    let redirectUrl = `${baseUrl}/`;
    if (session.tipo === "escuela" && session.cct) {
      redirectUrl = `${baseUrl}/escuela/${session.cct}`;
    } else if (session.tipo === "zona" && session.zona != null) {
      redirectUrl = `${baseUrl}/?zona=${session.zona}`;
    }

    if (json) {
      const res = NextResponse.json({ ok: true, redirect: redirectUrl }, { status: 200 });
      setSessionCookie(res, value);
      return res;
    }
    const res = NextResponse.redirect(redirectUrl, 302);
    setSessionCookie(res, value);
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error desconocido";
    if (process.env.NODE_ENV === "development") {
      console.error("Login error:", e);
    }
    const isAuthSecret = message.includes("AUTH_SECRET");
    const msg =
      process.env.NODE_ENV === "development"
        ? message
        : isAuthSecret
          ? "auth_secret_required"
          : "error";
    if (json) {
      return NextResponse.json(
        { ok: false, error: "server", msg },
        { status: 200 }
      );
    }
    return NextResponse.redirect(
      new URL(`/login?error=server&msg=${encodeURIComponent(msg)}`, request.url),
      302
    );
  }
}
