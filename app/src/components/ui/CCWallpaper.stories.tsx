import type { Meta } from '@storybook/react'
import { CCWallpaper } from './CCWallpaper'
import { Box } from '@mui/material'

interface Props extends Meta {
    override: string
}

export const Default = (props: Props): JSX.Element => {
    return (
        <Box display="flex" flexDirection="column" gap={2}>
            <CCWallpaper>
                <Box width="100%" height="200px" />
            </CCWallpaper>
            <CCWallpaper override={props.override}>
                <Box width="100%" height="200px" />
            </CCWallpaper>
        </Box>
    )
}

export default {
    title: 'ui/CCWallpaper',
    component: Default,
    tags: [],
    argTypes: {
        override: {
            control: 'text'
        }
    },
    args: {
        override: 'https://worldfile.cc/CC707E9Aa446961E6e6C33e5d69d827e5420B69E1f/a34c125d-1c53-4cdf-9e22-9df00328030f'
    },
    parameters: {}
}
