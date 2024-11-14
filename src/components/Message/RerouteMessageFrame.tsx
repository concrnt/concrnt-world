import { Box, IconButton, Link, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from '@mui/material'

import { type CoreProfile, type Message, type RerouteMessageSchema } from '@concurrent-world/client'
import RepeatIcon from '@mui/icons-material/Repeat'
import { CCAvatar } from '../ui/CCAvatar'
import { Link as routerLink, Link as RouterLink } from 'react-router-dom'
import { TimeDiff } from '../ui/TimeDiff'
import { MessageContainer } from './MessageContainer'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import { useEffect, useState } from 'react'
import ManageSearchIcon from '@mui/icons-material/ManageSearch'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import { useClient } from '../../context/ClientContext'
import { useInspector } from '../../context/Inspector'
import { MarkdownRendererLite } from '../ui/MarkdownRendererLite'
import { MarkdownRenderer } from '../ui/MarkdownRenderer'
import { FaTheaterMasks } from 'react-icons/fa'
import { useConfirm } from '../../context/Confirm'

export interface RerouteMessageFrameProp {
    message: Message<RerouteMessageSchema>
    lastUpdated?: number
    simple?: boolean
    additionalMenuItems?: JSX.Element | JSX.Element[]
}

export const RerouteMessageFrame = (props: RerouteMessageFrameProp): JSX.Element => {
    const { client } = useClient()
    const inspector = useInspector()
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
    const [character, setProfile] = useState<CoreProfile<any> | null>(null)
    const confirm = useConfirm()

    const profileOverride = props.message.document.body.profileOverride

    const avatarURL =
        character?.document.body.avatar ?? profileOverride?.avatar ?? props.message.authorUser?.profile?.avatar
    const username =
        character?.document.body.username ??
        profileOverride?.username ??
        props.message.authorUser?.profile?.username ??
        'Anonymous'
    const link = profileOverride?.link ?? '/' + props.message.author

    useEffect(() => {
        if (profileOverride?.profileID) {
            client.api.getProfileByID(profileOverride.profileID, props.message.author).then((character) => {
                setProfile(character ?? null)
            })
        }
    }, [profileOverride?.profileID])

    return (
        <>
            <Box display="flex" alignItems="center" gap={1}>
                <Box
                    display="flex"
                    width={{ xs: '38px', sm: '48px' }}
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <RepeatIcon sx={{ fontSize: '90%' }} />
                    <IconButton
                        sx={{
                            width: { xs: '12px', sm: '18px' },
                            height: { xs: '12px', sm: '18px' }
                        }}
                        component={routerLink}
                        to={link}
                    >
                        <CCAvatar
                            avatarURL={avatarURL}
                            identiconSource={props.message.author}
                            sx={{
                                width: { xs: '12px', sm: '18px' },
                                height: { xs: '12px', sm: '18px' }
                            }}
                        />
                    </IconButton>
                </Box>
                <Box
                    sx={{
                        fontSize: {
                            xs: '0.9rem',
                            sm: '1rem'
                        },
                        color: 'text.disabled',
                        fontWeight: 700,
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 0.5
                    }}
                >
                    {username}
                    {profileOverride?.avatar && <FaTheaterMasks />} rerouted{' '}
                    {props.message.document.body.body && 'with comment:'}
                </Box>
                <Box display="flex" gap={0.5}>
                    <IconButton
                        sx={{
                            width: { xs: '12px', sm: '18px' },
                            height: { xs: '12px', sm: '18px' },
                            color: 'text.disabled'
                        }}
                        onClick={(e) => {
                            setMenuAnchor(e.currentTarget)
                        }}
                    >
                        <MoreHorizIcon sx={{ fontSize: '80%' }} />
                    </IconButton>
                    <Link
                        component={RouterLink}
                        underline="hover"
                        color="inherit"
                        fontSize="0.75rem"
                        to={`/${props.message.author}/${props.message.id}`}
                    >
                        <TimeDiff date={new Date(props.message.cdate)} />
                    </Link>
                </Box>
            </Box>
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => {
                    setMenuAnchor(null)
                }}
            >
                <MenuItem
                    onClick={() => {
                        inspector.inspectItem({ messageId: props.message.id, author: props.message.author })
                        setMenuAnchor(null)
                    }}
                >
                    <ListItemIcon>
                        <ManageSearchIcon sx={{ color: 'text.primary' }} />
                    </ListItemIcon>
                    <ListItemText>詳細</ListItemText>
                </MenuItem>
                {props.additionalMenuItems}
                {props.message.author === client?.user?.ccid && (
                    <MenuItem
                        onClick={() => {
                            confirm.open(
                                'リルートを削除しますか？',
                                () => {
                                    props.message.delete()
                                },
                                { confirmText: '削除' }
                            )
                        }}
                    >
                        <ListItemIcon>
                            <DeleteForeverIcon sx={{ color: 'text.primary' }} />
                        </ListItemIcon>
                        <ListItemText>rerouteを削除</ListItemText>
                    </MenuItem>
                )}
            </Menu>
            {props.message.document.body.body && (
                <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
                    <Box display="flex" flexDirection="row-reverse" width={{ xs: '38px', sm: '48px' }} flexShrink={0} />
                    <Tooltip
                        arrow
                        placement="top"
                        title={
                            <MarkdownRenderer
                                messagebody={props.message.document.body.body}
                                emojiDict={props.message.document.body.emojis ?? {}}
                            />
                        }
                    >
                        <Box
                            overflow="hidden"
                            whiteSpace="nowrap"
                            textOverflow="ellipsis"
                            minWidth={0}
                            sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
                        >
                            <MarkdownRendererLite
                                messagebody={props.message.document.body.body}
                                emojiDict={props.message.document.body.emojis ?? {}}
                                forceOneline={true}
                            />
                        </Box>
                    </Tooltip>
                </Box>
            )}
            <MessageContainer
                simple={props.simple}
                messageID={props.message.document.body.rerouteMessageId}
                messageOwner={props.message.document.body.rerouteMessageAuthor}
                resolveHint={props.message.authorUser?.domain}
                rerouted={props.message}
            />
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'flex-end'
                }}
            ></Box>
        </>
    )
}
