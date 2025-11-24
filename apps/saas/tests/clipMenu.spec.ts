import { test, expect } from '@playwright/test'

test('clip menu abre e mostra opções', async ({ page }) => {
  await page.goto('/chat')
  await page.click('button[aria-label="Adicionar anexos"]')
  await expect(page.locator('button[aria-label="Adicionar anexos"]')).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('#clip-menu')).toBeVisible()
  for (const label of ['Documento','Galeria','Câmera','Áudio','Texto']) {
    await expect(page.locator(`#clip-menu >> text=${label}`)).toBeVisible()
  }
})

test('clip menu Texto fecha menu e mantém textarea visível', async ({ page }) => {
  await page.goto('/chat')
  await page.click('button[aria-label="Adicionar anexos"]')
  await expect(page.locator('#clip-menu')).toBeVisible()
  await page.click('#clip-menu >> button[aria-label="Texto"]')
  await expect(page.locator('#clip-menu')).toHaveCount(0)
  await expect(page.locator('textarea')).toBeVisible()
})

test('clip menu Galeria seta accept para image/video', async ({ page }) => {
  await page.goto('/chat')
  await page.click('button[aria-label="Adicionar anexos"]')
  await page.click('#clip-menu >> text=Galeria')
  const accept = await page.locator('input[type="file"]').getAttribute('accept')
  expect(accept).toContain('image/*')
  expect(accept).toContain('video/*')
})

test('clip menu Documento seta accept para .pdf,.txt', async ({ page }) => {
  await page.goto('/chat')
  await page.click('button[aria-label="Adicionar anexos"]')
  await page.click('#clip-menu >> text=Documento')
  const acceptDoc = await page.locator('input[type="file"]').getAttribute('accept')
  expect(acceptDoc?.includes('.pdf')).toBeTruthy()
  expect(acceptDoc?.includes('.txt')).toBeTruthy()
})
