// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://b81476fb5080e678134220e9a574f867@o4508155815264256.ingest.us.sentry.io/4511408457318400",
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 0.1,
  enableLogs: true,
  sendDefaultPii: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
