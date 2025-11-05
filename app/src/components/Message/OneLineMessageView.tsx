import { Box, IconButton, Tooltip } from '@mui/material'
import { Link as routerLink } from 'react-router-dom'
import { CCAvatar } from '../ui/CCAvatar'
import { TimeDiff } from '../ui/TimeDiff'
import { type Message, type ReplyMessageSchema, type MarkdownMessageSchema } from '@concrnt/worldlib'
import { CfmRendererLite } from '../ui/CfmRendererLite'
import { CCLink } from '../ui/CCLink'
import { CfmRenderer } from '../ui/CfmRenderer'

export interface OneLineMessageViewProps {
    message: Message<MarkdownMessageSchema | ReplyMessageSchema>
}

export const OneLineMessageView = (props: OneLineMessageViewProps): JSX.Element => {
    const externalLink = props.message.document.meta?.apObjectRef // Link to external message

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                color: 'text.disabled',
                overflow: 'hidden',
                flex: 1,
                gap: { xs: 1 }
            }}
        >
            <IconButton
                sx={{
                    width: { xs: '38px', sm: '48px' },
                    height: { xs: '12px', sm: '18px' }
                }}
                component={routerLink}
                to={'/' + props.message.author}
            >
                <CCAvatar
                    alt={props.message.authorProfile.username}
                    avatarURL={props.message.authorProfile.avatar}
                    identiconSource={props.message.authorProfile.ccid}
                    sx={{
                        width: { xs: '38px', sm: '48px' },
                        height: { xs: '12px', sm: '18px' }
                    }}
                />
            </IconButton>
            <Box display="flex" flex={1} overflow="hidden">
                <Box
                    overflow="hidden"
                    whiteSpace="nowrap"
                    textOverflow="ellipsis"
                    minWidth={0}
                    sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
                >
                    <CCLink
                        underline="none"
                        color="inherit"
                        fontSize="0.75rem"
                        to={externalLink ?? `/${props.message.author}/${props.message.id}`}
                    >
                        <Tooltip
                            arrow
                            placement="top"
                            title={
                                <CfmRenderer
                                    messagebody={props.message.document.body.body}
                                    emojiDict={props.message.document.body.emojis ?? {}}
                                />
                            }
                        >
                            <Box>
                                <CfmRendererLite
                                    messagebody={props.message.document.body.body}
                                    emojiDict={props.message.document.body.emojis ?? {}}
                                    forceOneline={true}
                                />
                            </Box>
                        </Tooltip>
                    </CCLink>
                </Box>
            </Box>
            <CCLink
                underline="hover"
                color="inherit"
                fontSize="0.75rem"
                to={externalLink ?? `/${props.message.author}/${props.message.id}`}
            >
                <TimeDiff date={new Date(props.message.cdate)} />
            </CCLink>
        </Box>
    )
}
