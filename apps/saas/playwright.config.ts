import { defineConfig, devices } from '@playwright/test'

/**
 * Configuração do Playwright para testes E2E
 * Focado em testes de Stripe Checkout em modo dev
 */

export default defineConfig({
  testDir: './tests',

  // Timeout para cada teste
  timeout: 30 * 1000,

  // Expect timeout
  expect: {
    timeout: 5000,
  },

  // Executar testes em paralelo
  fullyParallel: true,

  // Falhar build se houver testes com .only
  forbidOnly: !!process.env.CI,

  // Retry em caso de falha (útil para testes de rede)
  retries: process.env.CI ? 2 : 0,

  // Número de workers
  workers: process.env.CI ? 1 : undefined,

  // Reporter
  reporter: [
    ['html'],
    ['list'],
  ],

  // Configurações compartilhadas
  use: {
    // URL base
    baseURL: 'http://localhost:3000',

    // Trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Projetos de teste (diferentes browsers)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Web server local (Next.js dev)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true, // Sempre reutilizar servidor existente
    timeout: 120 * 1000,
  },
})
