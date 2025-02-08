import type { Meta } from '@storybook/react'
import { CCAvatar } from './CCAvatar'
import { Box } from '@mui/material'

interface Props extends Meta {
    identiconSource: string
    avatarURL: string
    avatarOverride?: string
}

export const Default = (props: Props): JSX.Element => {
    return (
        <Box display="flex" flexDirection="column" gap={1}>
            <Box display="flex" flexDirection="row" gap={1}>
                <CCAvatar identiconSource={props.identiconSource} />
                <CCAvatar identiconSource={props.identiconSource} avatarOverride={props.avatarOverride} />
            </Box>

            <Box display="flex" flexDirection="row" gap={1}>
                <CCAvatar identiconSource={props.identiconSource} avatarURL={props.avatarURL} />
                <CCAvatar
                    identiconSource={props.identiconSource}
                    avatarURL={props.avatarURL}
                    avatarOverride={props.avatarOverride}
                />
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
        },
        avatarOverride: {
            control: {
                type: 'text'
            }
        }
    },
    args: {
        identiconSource: 'con1t0tey8uxhkqkd4wcp4hd4jedt7f0vfhk29xdd2',
        avatarURL: 'https://github.com/totegamma.png',
        avatarOverride: 'https://github.com/concrnt.png'
    },
    parameters: {}
}
