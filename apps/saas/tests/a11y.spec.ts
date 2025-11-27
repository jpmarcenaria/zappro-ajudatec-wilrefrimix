import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('home atende WCAG 2.1 AA', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page: page as any }).withTags(['wcag2a','wcag2aa']).analyze()
  expect(results.violations).toEqual([])
})

test('chat atende WCAG 2.1 AA', async ({ page }) => {
  await page.goto('/chat')
  const results = await new AxeBuilder({ page: page as any }).withTags(['wcag2a','wcag2aa']).analyze()
  expect(results.violations).toEqual([])
})
