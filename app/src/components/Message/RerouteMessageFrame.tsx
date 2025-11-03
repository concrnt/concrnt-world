import { Box, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip, Typography } from '@mui/material'

import { type Message, type RerouteMessageSchema } from '@concrnt/worldlib'
import RepeatIcon from '@mui/icons-material/Repeat'
import { CCAvatar } from '../ui/CCAvatar'
import { Link as RouterLink } from 'react-router-dom'
import { TimeDiff } from '../ui/TimeDiff'
import { MessageContainer } from './MessageContainer'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import { useState } from 'react'
import ManageSearchIcon from '@mui/icons-material/ManageSearch'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import { useClient } from '../../context/ClientContext'
import { useInspector } from '../../context/Inspector'
import { CfmRendererLite } from '../ui/CfmRendererLite'
import { FaTheaterMasks } from 'react-icons/fa'
import { useConfirm } from '../../context/Confirm'
import { CCLink } from '../ui/CCLink'
import { CfmRenderer } from '../ui/CfmRenderer'
import { useTranslation } from 'react-i18next'

export interface RerouteMessageFrameProp {
    message: Message<RerouteMessageSchema>
    lastUpdated?: number
    simple?: boolean
    additionalMenuItems?: JSX.Element | JSX.Element[]
}

export const RerouteMessageFrame = (props: RerouteMessageFrameProp): JSX.Element => {
    const { t } = useTranslation('', { keyPrefix: 'ui.rerouteMessage' })
    const { client } = useClient()
    const inspector = useInspector()
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
    const confirm = useConfirm()

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
                        component={RouterLink}
                        to={
                            props.message.document.meta?.apActorId
                                ? `/ap/${props.message.document.meta.apActorId}`
                                : `/${props.message.author}`
                        }
                    >
                        <CCAvatar
                            avatarURL={props.message.authorProfile.avatar}
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
                        gap: 0.5,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                    }}
                >
                    <CCLink
                        to={
                            props.message.document.meta?.apActorId
                                ? `/ap/${props.message.document.meta.apActorId}`
                                : `/${props.message.author}`
                        }
                        underline="hover"
                        color="inherit"
                    >
                        {props.message.authorProfile.username ?? 'anonymous'}
                    </CCLink>
                    {props.message.authorProfile.original && <FaTheaterMasks />} rerouted{' '}
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
                    <Typography color="inherit" fontSize="0.75rem">
                        <TimeDiff date={new Date(props.message.cdate)} />
                    </Typography>
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
                    <ListItemText>{t('details')}</ListItemText>
                </MenuItem>
                {props.additionalMenuItems}
                {props.message.author === client?.user?.ccid && (
                    <MenuItem
                        onClick={() => {
                            confirm.open(
                                t('confirmDeleteReroute'),
                                () => {
                                    props.message.delete()
                                },
                                { confirmText: t('delete') }
                            )
                        }}
                    >
                        <ListItemIcon>
                            <DeleteForeverIcon sx={{ color: 'text.primary' }} />
                        </ListItemIcon>
                        <ListItemText>{t('deleteReroute')}</ListItemText>
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
                            <CfmRenderer
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
                            <CfmRendererLite
                                messagebody={props.message.document.body.body}
                                emojiDict={props.message.document.body.emojis ?? {}}
                                forceOneline={true}
                            />
                        </Box>
                    </Tooltip>
                </Box>
            )}
            <Box itemProp="citation" itemScope itemType="https://schema.org/SocialMediaPosting">
                <MessageContainer
                    simple={props.simple}
                    messageID={props.message.document.body.rerouteMessageId}
                    messageOwner={props.message.document.body.rerouteMessageAuthor}
                    resolveHint={props.message.authorUser?.domain}
                    rerouted={props.message}
                />
            </Box>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'flex-end'
                }}
            ></Box>
        </>
    )
}
