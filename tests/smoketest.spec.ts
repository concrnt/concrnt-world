import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.route(`https://www.googletagmanager.com/**`, route => {
        console.log('try to access:', route.request().url());
        route.abort()
    });
})

test(`detect-crash`, async ({ page }) => {
    await page.goto(`http://localhost:5173/crash`);
    await page.waitForLoadState('networkidle');
    const errorButton = page.getByRole('button', { name: 'リロード' })
    await expect(errorButton).toHaveCount(1);
})


const guestTests = [
    {name: 'welcome', path: '/welcome'},
    {name: 'import', path: '/import'},
    {name: 'register', path: '/register'},
    {name: 'timeline', path: '/timeline/tar69vv26r5s4wk0r067v20bvyw@ariake.concrnt.net'},
    {name: 'profile by ccid', path: '/con1t0tey8uxhkqkd4wcp4hd4jedt7f0vfhk29xdd2'},
    {name: 'profile by handle', path: '/tote.gammalab.net'},
    {name: 'content by ccid', path: '/con1t0tey8uxhkqkd4wcp4hd4jedt7f0vfhk29xdd2/m6mzjwdcvexhbt52q068rhdatj8'},
    {name: 'content by handle', path: '/tote.gammalab.net/m6mzjwdcvexhbt52q068rhdatj8'},
]

guestTests.forEach((t) => {
    test(`smoke-guest-${t.name}`, async ({ page }) => {
        await page.goto(`http://localhost:5173${t.path}`);
        const emblem = page.locator('#emblem').first();
        await expect(emblem).toBeVisible();
    });
})

const loggedinTests = [
    {name: 'home', path: '/'},
    {name: 'notifications', path: '/notifications'},
    {name: 'contacts', path: '/contacts'},
    {name: 'explorer-timelines', path: '/explorer/timelines'},
    {name: 'explorer-users', path: '/explorer/users'},
    {name: 'settings', path: '/settings'},
    {name: 'settings-general', path: '/settings/general'},
    {name: 'settings-profile', path: '/settings/profile'},
    {name: 'settings-identity', path: '/settings/identity'},
    {name: 'settings-theme', path: '/settings/theme'},
    {name: 'settings-sound', path: '/settings/sound'},
    {name: 'settings-emoji', path: '/settings/emoji'},
    {name: 'settings-storage', path: '/settings/storage'},
    {name: 'settings-loginqr', path: '/settings/loginqr'},
    {name: 'settings-inportexport-manage', path: '/settings/importexport/manage'},
    {name: 'settings-importexport-migrate', path: '/settings/importexport/migrate'},
    {name: 'settings-job', path: '/settings/job'},
    {name: 'subscriptions', path: '/subscriptions'},
    {name: 'timeline', path: '/timeline/tcjkcx7t5jdf3v5s6067yxcgpmm@zyouya.concrnt.net'},
    {name: 'profile by ccid', path: '/con1jhvwl4mf6mjwz27duu39fe0fqcfu8lhd05k9vg'},
    {name: 'profile by handle', path: '/e2etest.concrnt.world'},
    {name: 'content by ccid', path: '/con1jhvwl4mf6mjwz27duu39fe0fqcfu8lhd05k9vg/m1ke6xs34dfgxcht1068rk43338'},
    {name: 'content by handle', path: '/e2etest.concrnt.world/m1ke6xs34dfgxcht1068rk43338'},
]

loggedinTests.forEach((t) => {
    test(`smoke-loggedin-${t.name}`, async ({ page }) => {
        // set localStorage
        await page.addInitScript(() => {
            // board aunt arm cushion install lyrics provide giraffe subway cart again arrow
            localStorage.setItem('PrivateKey', '"02b03c01d6fa12f23980dcb9bb61eb4c022f406515cbe8cab9527dc8c15430fd"');
            localStorage.setItem('Domain', '"zyouya.concrnt.net"');
            localStorage.setItem('preference', '{"themeName":"blue","storageProvider":"domain","imgurClientID":"","s3Config":{"endpoint":"","accessKeyId":"","bucketName":"","publicUrl":"","secretAccessKey":"","forcePathStyle":false},"devMode":false,"showEditorOnTop":true,"showEditorOnTopMobile":false,"lists":{"snksm5vw9mat00yq7068rk5jz2m":{"pinned":true,"expanded":false,"defaultPostHome":true,"defaultPostStreams":["tcjkcx7t5jdf3v5s6067yxcgpmm@zyouya.concrnt.net"]}},"emojiPackages":["https://gist.githubusercontent.com/totegamma/6e1a047f54960f6bb7b946064664d793/raw/twemoji.json"],"sound":{"post":"/src/resources/Bubble.wav","notification":"/src/resources/Notification.wav","volume":50},"customThemes":{},"hideDisabledSubKey":false,"enableConcord":false}');
        });

        await page.goto(`http://localhost:5173${t.path}`);
        const emblem = page.locator('#emblem').first();
        await expect(emblem).toBeVisible();
    });
})

