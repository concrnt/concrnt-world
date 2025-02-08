import type { Meta } from '@storybook/react'
import { CCTextField } from './CCTextField'
import { Box } from '@mui/material'

interface Props extends Meta {}

export const Default = (_: Props): JSX.Element => {
    return (
        <Box display="flex" flexDirection="column" gap={2}>
            <CCTextField />
            <CCTextField label={'with label'} />
            <CCTextField label={'with placeholder'} placeholder={'placeholder'} />
            <CCTextField label={'with value'} value={'value'} />
        </Box>
    )
}

export default {
    title: 'ui/CCTextField',
    component: Default,
    tags: [],
    argTypes: {},
    args: {},
    parameters: {}
}
