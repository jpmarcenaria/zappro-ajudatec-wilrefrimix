import { test, expect } from '@playwright/test'

test('home carrega', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('main')).toBeVisible()
})

test('chat envia texto', async ({ page }) => {
  await page.goto('/chat')
  const ta = page.locator('textarea')
  await ta.fill('Teste E2E')
  await page.keyboard.press('Enter')
  await expect(page.locator('text=Teste E2E')).toBeVisible()
})

test('upload imagem como anexo', async ({ page }) => {
  await page.goto('/chat')
  const file = 'tests/fixtures/sample.svg'
  await page.setInputFiles('input[type="file"]', file)
  await page.click('button[aria-label="Enviar mensagem"]')
  await expect(page.locator('img[alt="anexo"]').first()).toBeVisible()
})

test('upload documento txt como anexo', async ({ page }) => {
  await page.goto('/chat')
  const file = 'tests/fixtures/sample.txt'
  await page.setInputFiles('input[type="file"]', file)
  await page.click('button[aria-label="Enviar mensagem"]')
  await expect(page.locator('text=PDF / DOC')).toBeVisible()
})

test('mobile viewport responsivo', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/')
  await expect(page.locator('nav >> text=ZapPRO').first()).toBeVisible()
})

test('professores endpoint responde com lista', async ({ request }) => {
  const res = await request.get('/api/search/professors')
  expect(res.status()).toBe(200)
  const json = await res.json()
  expect(Array.isArray(json.items)).toBeTruthy()
})

test('link de assinatura leva para o checkout', async ({ page }) => {
  await page.goto('/');
  const checkoutLink = page.locator('a[href*="checkout.stripe.com"]');
  await expect(checkoutLink).toBeVisible();
  await checkoutLink.click();
  await expect(page).toHaveURL(/checkout.stripe.com/);
});
