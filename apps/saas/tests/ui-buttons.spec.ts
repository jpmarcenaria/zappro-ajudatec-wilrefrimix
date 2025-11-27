import { test, expect } from '@playwright/test'

test.describe('UI Botões principais', () => {
  test('Home tem CTA e navegação', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: /Assinar|Começar|Start/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Status|Biblioteca|Chat/i })).toBeVisible()
  })

  test('Chat renderiza e envia mensagem vazia com segurança', async ({ page }) => {
    await page.goto('/chat')
    await expect(page.getByLabel('Enviar mensagem')).toBeVisible()
    await page.getByLabel('Enviar mensagem').click()
    await expect(page).toHaveURL(/\/chat/)
  })

  test('Biblioteca de Manuais lista marcas e busca', async ({ page }) => {
    await page.goto('/manuals')
    await expect(page.getByPlaceholder(/busca|modelo|marca/i)).toBeVisible()
    const cards = page.locator('section').locator('div').filter({ hasText: /Manual|Modelo|Marca/i })
    await expect(cards.first()).toBeVisible()
  })
})
