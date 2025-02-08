import type { StorybookConfig } from '@storybook/react-vite'
const config: StorybookConfig = {
    stories: ['../src/**/*.stories.ts', '../src/**/*.stories.tsx'],
    addons: ['@storybook/addon-essentials'],
    framework: {
        name: '@storybook/react-vite',
        options: {}
    },
    docs: {}
}
export default config
