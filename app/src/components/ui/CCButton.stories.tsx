import type { Meta } from '@storybook/react'
import { CCButton } from './CCButton'
import { Box } from '@mui/material'

interface Props extends Meta {
    text: string
}

export const Default = (props: Props): JSX.Element => {
    return (
        <Box display="flex" flexDirection="row" gap={2}>
            <CCButton>{props.text}</CCButton>
            <CCButton disabled>{props.text}</CCButton>
        </Box>
    )
}

export default {
    title: 'ui/CCButton',
    component: Default,
    tags: [],
    argTypes: {
        text: {
            control: {
                type: 'text'
            }
        }
    },
    args: {
        text: 'Button'
    },
    parameters: {}
}
