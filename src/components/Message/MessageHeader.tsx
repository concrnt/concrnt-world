import { Box, Typography, Link, Tooltip, Menu, IconButton } from '@mui/material'
import { TimeDiff } from '../ui/TimeDiff'
import { Link as RouterLink } from 'react-router-dom'
import { useMemo, useState } from 'react'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { type Message, type ReplyMessageSchema, type MarkdownMessageSchema } from '@concurrent-world/client'

import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import { useClient } from '../../context/ClientContext'
import { ConcordBadge } from '../ui/Badge'
import LockIcon from '@mui/icons-material/Lock'
import { CCUserChip } from '../ui/CCUserChip'
import { FaTheaterMasks } from 'react-icons/fa'

export interface MessageHeaderProps {
    message: Message<MarkdownMessageSchema | ReplyMessageSchema>
    usernameOverride?: string
    additionalMenuItems?: JSX.Element | JSX.Element[]
    timeLink?: string
}

export const MessageHeader = (props: MessageHeaderProps): JSX.Element => {
    const { client } = useClient()
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)

    const myAck = useMemo(() => {
        return client.ackings?.find((ack) => ack.ccid === props.message.author)
    }, [props.message, client])

    const isWhisper = props.message?.policy === 'https://policy.concrnt.world/m/whisper.json'
    const participants: string[] = isWhisper ? props.message.policyParams?.participants : []

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between'
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    overflow: 'hidden'
                }}
            >
                <Typography
                    component="span"
                    sx={{
                        fontWeight: '700',
                        fontSize: { xs: '0.9rem', sm: '0.95rem' },
                        flexShrink: 0
                    }}
                >
                    {props.usernameOverride ||
                        props.message.document.body.profileOverride?.username ||
                        props.message.authorUser?.profile?.username ||
                        'anonymous'}
                </Typography>
                {props.message.document.body.profileOverride &&
                    Object.keys(props.message.document.body.profileOverride).length > 0 && <FaTheaterMasks />}{' '}
                {myAck && (
                    <Tooltip arrow title="フォローしています" placement="top">
                        <CheckCircleIcon
                            sx={{
                                fontSize: '1rem',
                                color: 'primary.main'
                            }}
                        />
                    </Tooltip>
                )}
                {props.message.authorUser?.profile?.badges?.map((badge, i) => (
                    <ConcordBadge
                        key={i}
                        badgeRef={badge}
                        sx={{
                            height: '0.9rem',
                            borderRadius: 0.5
                        }}
                    />
                ))}
                {props.message.authorUser?.alias && (
                    <Typography
                        component="span"
                        sx={{
                            color: 'text.secondary',
                            fontSize: '0.75rem',
                            flexShrink: 0
                        }}
                    >
                        @{props.message.authorUser.alias}
                    </Typography>
                )}
            </Box>
            <Box display="flex" gap={0.5}>
                {props.additionalMenuItems && (
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
                )}
                {isWhisper && (
                    <Tooltip
                        placement="top"
                        title={
                            <Box>
                                <Typography color="text.primary">Whisper to:</Typography>
                                {participants?.map((participant, i) => (
                                    <CCUserChip avatar key={i} ccid={participant} />
                                ))}
                            </Box>
                        }
                        componentsProps={{
                            tooltip: {
                                sx: {
                                    backgroundColor: 'background.paper',
                                    border: '1px solid',
                                    borderColor: 'divider'
                                }
                            }
                        }}
                    >
                        <LockIcon
                            sx={{
                                width: '1rem',
                                height: '1rem',
                                color: 'text.disabled'
                            }}
                        />
                    </Tooltip>
                )}
                <Link
                    component={RouterLink}
                    underline="hover"
                    color="inherit"
                    fontSize="0.75rem"
                    to={props.timeLink ?? `/${props.message.author}/${props.message.id}`}
                    target={props.timeLink ? '_blank' : '_self'}
                >
                    <TimeDiff date={new Date(props.message.document.signedAt)} base={new Date(props.message.cdate)} />
                </Link>
            </Box>
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => {
                    setMenuAnchor(null)
                }}
            >
                {props.additionalMenuItems}
            </Menu>
        </Box>
    )
}
