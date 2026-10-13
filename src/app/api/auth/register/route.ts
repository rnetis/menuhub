import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession, SESSION_COOKIE } from "@/lib/auth";
import { apiError } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const name = String(body.name || "").trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return apiError("Please enter a valid email address");
    }
    if (password.length < 6) {
      return apiError("Password must be at least 6 characters");
    }
    if (!name) {
      return apiError("Name is required");
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return apiError("An account with this email already exists", 409);
    }

    const user = await db.user.create({
      data: { email, name, passwordHash: hashPassword(password) },
    });

    const { token, expiresAt } = await createSession(user.id);
    const res = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, isPlatformAdmin: user.isPlatformAdmin },
    });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      expires: expiresAt,
      path: "/",
    });
    return res;
  } catch (e) {
    console.error("register error", e);
    return apiError("Registration failed", 500);
  }
}
