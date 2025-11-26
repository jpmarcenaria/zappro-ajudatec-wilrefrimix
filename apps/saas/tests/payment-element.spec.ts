import { test, expect } from '@playwright/test'

test.describe('Stripe Payment Element', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/payment')
  })

  test('deve montar Payment Element na página', async ({ page }) => {
    await expect(page.locator('text=Pagamento')).toBeVisible()
    await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 15000 })
  })

  test('deve bloquear pagamento sem preencher dados', async ({ page }) => {
    await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 15000 })
    await page.getByRole('button', { name: /Pagar R\$\s*99[,.]90/i }).click()
    await expect(page).not.toHaveURL(/\/success/, { timeout: 3000 })
  })

  test('API deve retornar client_secret para Payment Element', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/payments/create-intent')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.client_secret).toBeTruthy()
    expect(data.id).toBeTruthy()
  })

  test('botão Assinar deve abrir Payment Element e carregar iframes', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    await expect(page.locator('button:has-text("Assinar")')).toBeVisible()
    await page.click('button:has-text("Assinar")')
    const wentToPayment = await page.waitForURL(/\/payment$/, { timeout: 15000 }).then(() => true).catch(() => false)
    if (wentToPayment) {
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 15000 })
      await expect(page.locator('iframe[name^="__privateStripeFrame"]')).toBeVisible()
    } else {
      await page.waitForURL(/(checkout|buy)\.stripe\.com/, { timeout: 20000 })
      expect(page.url()).toMatch(/(checkout|buy)\.stripe\.com/)
    }
  })
})
