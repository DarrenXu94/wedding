// src/middleware.ts
import { defineMiddleware } from "astro:middleware";
import { verifySessionToken } from "./lib/auth";

export const onRequest = defineMiddleware((context, next) => {
  if (context.url.pathname === "/") {
    const session = verifySessionToken(context.cookies.get("site-auth")?.value);

    if (!session) {
      return context.redirect("/login");
    }

    // Available in your pages as Astro.locals.user — e.g. `Hi, {user.name}`
    context.locals.user = session;
  }
  return next();
});
