import { serve } from "@hono/node-server";
import { createApp } from "./api/server.js";
import { getEnv } from "./config/env.js";

const env = getEnv();
const app = createApp();

console.log(`Sigil starting on port ${env.PORT}`);
console.log(`Frontend URL: ${env.FRONTEND_URL}`);
console.log(`Base URL: ${env.BASE_URL}`);

serve({
  fetch: app.fetch,
  port: env.PORT,
});

console.log(`Server running at ${env.BASE_URL}`);
