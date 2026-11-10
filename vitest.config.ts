import path from "node:path"
import { config } from "dotenv"
import { defineConfig } from "vitest/config"

config()

// Integration tests run against their own database, never the dev one.
const dev = process.env.DATABASE_URL ?? "postgres://shopkart:shopkart@localhost:5433/shopkart_dev"
const testUrl = process.env.DATABASE_URL_TEST ?? dev.replace(/\/[^/?]+(\?.*)?$/, "/shopkart_test$1")
if (!/_test(\?|$)/.test(testUrl)) throw new Error(`Refusing to run tests against "${testUrl}": the database name must end in _test`)

// Global setup runs in the main process, so it needs the test URL too (not only the workers).
process.env.DATABASE_URL = testUrl

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["./tests/global-setup.ts"],
    env: {
      DATABASE_URL: testUrl, DISABLE_RATE_LIMIT: "1", BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-123", APP_ORIGIN: "http://localhost:3000",
      // Payments are pinned here so the tests behave the same whatever is in .env: dummy gateway on, no Razorpay keys.
      ENABLE_MOCK_PAYMENTS: "1", MOCK_PAYMENT_SECRET: "test-mock-secret", RAZORPAY_KEY_ID: "", RAZORPAY_KEY_SECRET: "", RAZORPAY_WEBHOOK_SECRET: "",
    },
    // One shared database, so test files run one after another.
    fileParallelism: false,
    testTimeout: 30_000,
  },
  resolve: { alias: { "server-only": path.resolve("tests/stubs/server-only.ts"), "@": path.resolve(".") } },
})
