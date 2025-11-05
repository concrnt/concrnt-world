import type { Meta } from '@storybook/react'
import { CCAvatar } from './CCAvatar'
import { Box } from '@mui/material'

interface Props extends Meta {
    identiconSource: string
    avatarURL: string
}

export const Default = (props: Props): JSX.Element => {
    return (
        <Box display="flex" flexDirection="column" gap={1}>
            <Box display="flex" flexDirection="row" gap={1}>
                <CCAvatar identiconSource={props.identiconSource} />
            </Box>

            <Box display="flex" flexDirection="row" gap={1}>
                <CCAvatar identiconSource={props.identiconSource} avatarURL={props.avatarURL} />
                <CCAvatar identiconSource={props.identiconSource} avatarURL={props.avatarURL} />
            </Box>
        </Box>
    )
}

export default {
    title: 'ui/CCAvatar',
    component: Default,
    tags: [],
    argTypes: {
        identiconSource: {
            control: {
                type: 'text'
            }
        },
        avatarURL: {
            control: {
                type: 'text'
            }
        }
    },
    args: {
        identiconSource: 'con1t0tey8uxhkqkd4wcp4hd4jedt7f0vfhk29xdd2',
        avatarURL: 'https://github.com/totegamma.png'
    },
    parameters: {}
}
