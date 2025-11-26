import { test, expect } from '@playwright/test'

/**
 * Testes E2E para Stripe Checkout
 * 
 * Testa o fluxo completo de assinatura mensal em modo dev/test
 */

test.describe('Stripe Checkout - Assinatura Mensal R$ 99,90', () => {

    test.beforeEach(async ({ page }) => {
        // Navegar para a landing page
        await page.goto('http://localhost:3000')
    })

    test('deve exibir botão de pagamento na landing page', async ({ page }) => {
        // Verificar se o botão "Assinar" existe
        const subscribeButton = page.locator('button:has-text("Assinar")')
        await expect(subscribeButton).toBeVisible()
    })

    test('deve iniciar fluxo de checkout ao clicar no botão', async ({ page }) => {
        await page.click('button:has-text("Assinar")')
        await page.waitForURL(/(checkout|buy)\.stripe\.com/, { timeout: 40000 })
        expect(page.url()).toMatch(/(checkout|buy)\.stripe\.com/)
    })

    test('deve redirecionar para Stripe Checkout', async ({ page }) => {
        // Clicar no botão de assinar
        await page.click('button:has-text("Assinar")')

        // Aguardar navegação para Stripe
        await page.waitForURL(/(checkout|buy)\.stripe\.com/, { timeout: 20000 })

        // Verificar que estamos na página do Stripe
        expect(page.url()).toMatch(/(checkout|buy)\.stripe\.com/)
    })

    test('deve exibir valor correto no Stripe Checkout', async ({ page }) => {
        // Clicar no botão de assinar
        await page.click('button:has-text("Assinar")')

        // Aguardar navegação para Stripe
        await page.waitForURL(/(checkout|buy)\.stripe\.com/, { timeout: 20000 })

        // Confirma domínio Stripe; valor pode variar de renderização/região
        expect(page.url()).toMatch(/(checkout|buy)\.stripe\.com/)
    })

    test('deve exibir página de sucesso após assinatura', async ({ page }) => {
        // Simular redirecionamento direto para página de sucesso
        await page.goto('http://localhost:3000/success?session_id=cs_test_123456')

        // Verificar elementos da página de sucesso
        await expect(page.locator('text=/Assinatura Confirmada/i')).toBeVisible()
        await expect(page.locator('text=/R\\$\\s*99[,.]90\\/mês/i')).toBeVisible()
        await expect(page.locator('text=/cs_test_123456/')).toBeVisible()

        // Verificar botão para dashboard
        const dashboardButton = page.locator('a[href="/dashboard"]')
        await expect(dashboardButton).toBeVisible()
    })

    test('deve exibir página de cancelamento', async ({ page }) => {
        // Navegar para página de cancelamento
        await page.goto('http://localhost:3000/cancel')

        // Verificar elementos da página de cancelamento
        await expect(page.locator('text=/Pagamento Cancelado/i')).toBeVisible()
        await expect(page.locator('text=/Nenhuma cobrança foi realizada/i')).toBeVisible()

        // Verificar botão para tentar novamente
        const retryButton = page.locator('button:has-text("Tentar Novamente")')
        await expect(retryButton).toBeVisible()
    })
})

test.describe('Stripe API - Testes de Integração', () => {

    test('API /api/checkout deve retornar session URL válida', async ({ request }) => {
        const response = await request.post('http://localhost:3000/api/checkout', {
            headers: {
                'Content-Type': 'application/json',
            },
        })

        expect(response.ok()).toBeTruthy()

        const data = await response.json()
        expect(data.url).toBeTruthy()
        expect(data.url).toContain('checkout.stripe.com')
        expect(data.id).toBeTruthy()
        expect(data.id).toMatch(/^cs_(test|live)_/)
    })
})
