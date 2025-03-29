import { test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
    await page.route(`https://www.googletagmanager.com/**`, (route) => {
        console.log('try to access:', route.request().url())
        route.abort()
    })
})

test('Account registration', async ({ page }) => {
    // Access the page
    await page.goto('http://localhost:5173/')

    // has registration link
    const link = page.locator('a[href="/register"]').first()

    // Click on the registration link
    await link.click()

    // Select the registration form
    const customSetupButton = page.locator('#RegistrationCustomButton')
    await customSetupButton.click()

    // select zyouya.concrnt.net
    const zyouyaText = page.locator('text=zyouya.concrnt.net')
    const zyouyaButton = page.locator('div[role="button"]').filter({ has: zyouyaText })
    await zyouyaButton.click()

    // Fill the registration form
    await page.fill('#root_name', 'e2e tester')
    await page.fill('#root_email', 'e2e-test@example.com')
    await page.fill('#root_social', '@e2e-test')
    // check the terms and conditions
    await page.check('input[name="root_consent"]')

    // Submit the form
    await page.click('button[type="submit"]')

    // fill profile
    const profUsername = page.locator('input[name="username"]')
    await profUsername.fill('e2e-test')

    // fill description
    const profDescription = page.locator('textarea[name="description"]')
    await profDescription.fill('e2e-test')

    // Submit
    const submitButton = page.getByRole('button', { name: 'Create' })
    await submitButton.click()

    // press start
    const startButton = page.getByRole('button', { name: 'Start' })
    await startButton.click()

    // press get started
    await page.getByRole('button', { name: 'Get Started' }).first().click()

    // ok
})
