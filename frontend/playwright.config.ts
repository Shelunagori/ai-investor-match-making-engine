import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  use: { baseURL: "http://127.0.0.1:5173", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: [
    {
      command:
        "../.venv/bin/uvicorn app.main:app --app-dir ../backend --host 127.0.0.1 --port 8000",
      url: "http://127.0.0.1:8000/health",
      reuseExistingServer: false,
      env: {
        AS_OF_DATE: "2026-10-14",
        DATABASE_URL: "",
        CLOUDFLARE_ACCOUNT_ID: "",
        CLOUDFLARE_API_TOKEN: "",
      },
    },
    {
      command: "npm run dev",
      env: { VITE_API_URL: "" },
      url: "http://127.0.0.1:5173",
      reuseExistingServer: false,
    },
  ],
});
