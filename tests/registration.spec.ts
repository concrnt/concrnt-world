import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.route(`https://www.googletagmanager.com/**`, route => {
        console.log('try to access:', route.request().url());
        route.abort()
    });
})

test('Account registration', async ({ page }) => {
    // Access the page
    await page.goto('http://localhost:5173/');

    // has registration link
    const link = page.locator('a[href="/register"]').first();

    // Click on the registration link
    await link.click();

    // Select the registration form
    const customSetupButton = page.locator('#RegistrationCustomButton');
    await customSetupButton.click();

    // select zyouya.concrnt.net
    const zyouyaText = page.locator('text=zyouya.concrnt.net');
    const zyouyaButton = page.locator('div[role="button"]').filter({has: zyouyaText});
    await zyouyaButton.click();

    // Fill the registration form
    await page.fill('#root_name', 'e2e tester');
    await page.fill('#root_email', 'e2e-test@example.com');
    await page.fill('#root_social', '@e2e-test');
    // check the terms and conditions
    await page.check('input[name="root_consent"]');

    // Submit the form
    await page.click('button[type="submit"]');

    // fill profile
    const profUsername = page.locator('input[name="username"]');
    await profUsername.fill('e2e-test');

    // fill description
    const profDescription = page.locator('textarea[name="description"]');
    await profDescription.fill('e2e-test');

    // Submit
    const submitButton = page.getByRole('button', { name: 'Create' })
    await submitButton.click();

    // press start
    const startButton = page.getByRole('button', { name: 'Start' })
    await startButton.click();

    // get 常夜灯
    await page.getByRole('button', {name: '常夜灯'}).click();

    // get はじめる
    await page.getByRole('button', {name: 'はじめる'}).click();

    // check result

    const viewSize = page.viewportSize();
    const isDesktop = viewSize && viewSize.width > 960;

    if (isDesktop) {
        // open list
        await page.locator('svg[data-testid="ExpandMoreIcon"]').click();

        // has link
        const zyouya_link = page.getByRole('link', { name: '常夜灯' })
        await expect(zyouya_link).toHaveAttribute('href', '/timeline/tcjkcx7t5jdf3v5s6067yxcgpmm@zyouya.concrnt.net')

    }

    // ok
});

