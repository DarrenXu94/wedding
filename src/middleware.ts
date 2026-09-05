// src/middleware.ts
import { defineMiddleware } from "astro:middleware";
import { verifySessionToken } from "./lib/auth";

export const onRequest = defineMiddleware((context, next) => {
  if (
    context.url.pathname === "/" ||
    context.url.pathname.startsWith("/api/rsvp")
  ) {
    const session = verifySessionToken(context.cookies.get("site-auth")?.value);

    if (!session) {
      if (context.url.pathname.startsWith("/api/")) {
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401,
        });
      }
      return context.redirect("/login");
    }

    // Available in your pages as Astro.locals.user — e.g. `Hi, {user.name}`
    context.locals.user = session;
  }
  return next();
});
