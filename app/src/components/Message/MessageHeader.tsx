import { Box, Typography, Tooltip, Menu, IconButton } from '@mui/material'
import { TimeDiff } from '../ui/TimeDiff'
import { useMemo, useState } from 'react'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { type Message, type ReplyMessageSchema, type MarkdownMessageSchema } from '@concrnt/worldlib'

import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import { useClient } from '../../context/ClientContext'
import { ConcordBadge } from '../ui/Badge'
import LockIcon from '@mui/icons-material/Lock'
import { CCUserChip } from '../ui/CCUserChip'
import { FaTheaterMasks } from 'react-icons/fa'
import { CCLink } from '../ui/CCLink'
import { useTranslation } from 'react-i18next'

export interface MessageHeaderProps {
    message: Message<MarkdownMessageSchema | ReplyMessageSchema>
    additionalMenuItems?: JSX.Element | JSX.Element[]
    timeLink?: string
}

export const MessageHeader = (props: MessageHeaderProps): JSX.Element => {
    const { t } = useTranslation()
    const { client } = useClient()
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)

    const myAck = useMemo(() => {
        return client.ackings?.find((ack) => ack.ccid === props.message.author)
    }, [props.message, client])

    const isWhisper = props.message?.policy === 'https://policy.concrnt.world/m/whisper.json'
    const participants: string[] = isWhisper ? props.message.policyParams.participants : []

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
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                }}
            >
                <CCLink
                    underline="hover"
                    color="inherit"
                    to={
                        props.message.document.meta?.apActorId
                            ? `/ap/${props.message.document.meta.apActorId}`
                            : `/${props.message.author}`
                    }
                    sx={{
                        flexShrink: 0
                    }}
                >
                    <Typography
                        component="span"
                        sx={{
                            fontWeight: '700',
                            fontSize: { xs: '0.9rem', sm: '0.95rem' }
                        }}
                    >
                        {props.message.authorProfile.username || 'anonymous'}
                    </Typography>
                </CCLink>
                {props.message.document.body.profileOverride &&
                    Object.keys(props.message.document.body.profileOverride).length > 0 && <FaTheaterMasks />}{' '}
                {myAck && (
                    <Tooltip arrow title={t('common.following')} placement="top">
                        <CheckCircleIcon
                            sx={{
                                fontSize: '1rem',
                                color: 'text.secondary'
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
                <CCLink
                    underline="hover"
                    color="inherit"
                    fontSize="0.75rem"
                    to={props.timeLink ?? `/${props.message.author}/${props.message.id}`}
                >
                    <TimeDiff date={new Date(props.message.document.signedAt)} base={new Date(props.message.cdate)} />
                </CCLink>
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
