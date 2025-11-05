import {
    User,
    type MarkdownMessageSchema,
    type Message,
    type ReplyMessageSchema,
    type UserProfile
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
    profile: UserProfile
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
                <>
                    <meta itemProp="identifier" content={props.profile.ccid} />
                    <meta itemProp="url" content={'https://concrnt.world/' + props.profile.ccid} />
                </>
                {props.profile.alias && <meta itemProp="alternateName" content={props.profile.alias} />}
                {props.profile.username && (
                    <>
                        <meta itemProp="name" content={props.profile.username} />
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
                        <ProfileTooltip user={props.author} profile={props.profile}>
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
                                        (props.profile.ccid ?? '') +
                                        (props.profile.profileOverrideID ? '#' + props.profile.profileOverrideID : '')
                                }
                                onPointerDown={() => profile.forceClose()} // prevent to stick showing when clicking
                            >
                                <CCAvatar
                                    avatarURL={props.profile.avatar}
                                    identiconSource={props.profile.ccid}
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
