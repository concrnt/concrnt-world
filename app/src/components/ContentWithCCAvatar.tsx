import {
    type MarkdownMessageSchema,
    type Message,
    type ReplyMessageSchema,
    type ProfileSchema,
    type User,
    type ProfileOverride
} from '@concrnt/worldlib'
import { Box, IconButton, ListItem, type SxProps } from '@mui/material'
import { Link as routerLink, useNavigate, useLocation } from 'react-router-dom'
import { CCAvatar } from './ui/CCAvatar'
import { useRef } from 'react'
import { ProfileTooltip, useProfile } from '../context/ProfileContext'

export interface ContentWithCCAvatarProps {
    message?: Message<MarkdownMessageSchema | ReplyMessageSchema>
    linkTo?: string
    author?: User
    profileOverride?: ProfileOverride
    characterOverride?: ProfileSchema
    avatarOverride?: string
    children?: JSX.Element | Array<JSX.Element | undefined>
    sx?: SxProps
    apId?: string
}

export const ContentWithCCAvatar = (props: ContentWithCCAvatarProps): JSX.Element => {
    const navigate = useNavigate()
    const location = useLocation()

    const navigateTo = props.linkTo ?? `/${props.message?.author}/${props.message?.id}`
    const apLink = props.apId ? `/ap/${props.apId}` : undefined
    const buttonEl = useRef<HTMLElement>(null)

    const profile = useProfile()

    return (
        <>
            <Box itemProp="author" itemScope itemType="https://schema.org/Person">
                {props.author && (
                    <>
                        <meta itemProp="identifier" content={props.author.ccid} />
                        <meta itemProp="url" content={'https://concrnt.world/' + props.author.ccid} />
                    </>
                )}
                {props.author?.alias && <meta itemProp="alternateName" content={props.author.alias} />}
                {props.author?.profile?.username && (
                    <>
                        <meta itemProp="name" content={props.author.profile.username} />
                    </>
                )}
            </Box>
            <Box
                sx={{ cursor: location.pathname !== navigateTo ? 'pointer' : 'auto' }}
                onClick={() => {
                    const selectedString = window.getSelection()?.toString()
                    if (selectedString !== '') return
                    navigate(navigateTo)
                }}
            >
                <ListItem
                    sx={{
                        wordBreak: 'break-word',
                        alignItems: 'flex-start',
                        flex: 1,
                        gap: { xs: 0.5, sm: 1 }
                    }}
                    disablePadding
                >
                    <Box
                        ref={buttonEl}
                        onClick={(e) => {
                            e.stopPropagation() // prevent to navigate other page
                        }}
                    >
                        <ProfileTooltip
                            user={props.author}
                            subProfileID={props.profileOverride?.profileID}
                            profileOverride={props.profileOverride}
                        >
                            <IconButton
                                sx={{
                                    width: { xs: '38px', sm: '48px' },
                                    height: { xs: '38px', sm: '48px' },
                                    mt: { xs: '3px', sm: '5px' }
                                }}
                                component={routerLink}
                                to={
                                    apLink ??
                                    '/' +
                                        (props.author?.ccid ?? '') +
                                        (props.profileOverride?.profileID ? '#' + props.profileOverride.profileID : '')
                                }
                                onPointerDown={() => profile.forceClose()} // prevent to stick showing when clicking
                            >
                                <CCAvatar
                                    avatarURL={props.author?.profile?.avatar}
                                    avatarOverride={props.avatarOverride || props.profileOverride?.avatar}
                                    identiconSource={props.author?.ccid ?? ''}
                                    sx={{
                                        width: { xs: '38px', sm: '48px' },
                                        height: { xs: '38px', sm: '48px' }
                                    }}
                                />
                            </IconButton>
                        </ProfileTooltip>
                    </Box>
                    <Box
                        sx={{
                            display: 'flex',
                            flex: 1,
                            flexDirection: 'column',
                            width: '100%',
                            overflow: 'hidden',
                            ...props.sx
                        }}
                    >
                        {props.children}
                    </Box>
                </ListItem>
            </Box>
        </>
    )
}
