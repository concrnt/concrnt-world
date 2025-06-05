import {
    type Message,
    type ReplyMessageSchema,
    type RerouteMessageSchema,
    Schemas,
    type MarkdownMessageSchema,
    type MediaMessageSchema,
    type PlaintextMessageSchema
} from '@concrnt/worldlib'
import { useClient } from '../../context/ClientContext'
import { memo, useEffect, useMemo, useState } from 'react'
import { ReplyMessageFrame } from './ReplyMessageFrame'
import { RerouteMessageFrame } from './RerouteMessageFrame'
import { MessageSkeleton } from '../MessageSkeleton'
import { Box, type SxProps, Typography, Button, useTheme, alpha } from '@mui/material'
import { usePreference } from '../../context/PreferenceContext'
import { ContentWithUserFetch } from '../ContentWithUserFetch'
import { CopyChip } from '../ui/CopyChip'
import { PlainMessageView } from './PlainMessageView'
import { MediaMessageView } from './MediaMessageView'
import { NotFoundError, PermissionError } from '@concrnt/client'
import { MarkdownMessageView } from './MarkdownMessageView'
import { Link as routerLink } from 'react-router-dom'
import { CCAvatarWithResolver } from '../ui/CCAvatarWithResolver'
import { useTranslation } from 'react-i18next'
import { useGlobalState } from '../../context/GlobalState'
import { GfmMessageView } from './GfmMessageView'

import SearchOffIcon from '@mui/icons-material/SearchOff'
import TerminalIcon from '@mui/icons-material/Terminal'
import InfoIcon from '@mui/icons-material/Info'
import { MisskeyMessageView } from './MisskeyMessageView'

interface MessageContainerProps {
    messageID: string
    messageOwner: string
    resolveHint?: string
    lastUpdated?: number
    after?: JSX.Element | undefined
    timestamp?: Date
    rerouted?: Message<RerouteMessageSchema>
    simple?: boolean
    sx?: SxProps
    dimOnHover?: boolean
}

export const MessageContainer = memo<MessageContainerProps>((props: MessageContainerProps): JSX.Element | null => {
    const { client } = useClient()
    const { t } = useTranslation('', { keyPrefix: 'common' })
    const theme = useTheme()
    const [message, setMessage] = useState<Message<
        MarkdownMessageSchema | ReplyMessageSchema | RerouteMessageSchema | PlaintextMessageSchema | MediaMessageSchema
    > | null>()
    const [isFetching, setIsFetching] = useState<boolean>(true)
    const [devMode] = usePreference('devMode')
    const [forceUpdateCount, setForceUpdateCount] = useState<number>(0)
    const [_, setStaticUpdateCount] = useState<number>(0)
    const [error, setError] = useState<Error | null>(null)
    const { isMessageSafeToShow } = useGlobalState()
    const [filteredWord, setFilteredWord] = useState<string | undefined>()
    const [filteredTimeline, setFilteredTimeline] = useState<string | undefined>()
    const [filterOverride, setFilterOverride] = useState<boolean>(false)

    if (message) {
        message.onUpdate = () => {
            setStaticUpdateCount((prev) => prev + 1)
        }
    }

    useEffect(() => {
        client
            .getMessage<any>(props.messageID, props.messageOwner, props.resolveHint)
            .then((msg) => {
                setMessage(msg)
                if (msg?.document.body?.body) {
                    const filter = isMessageSafeToShow(msg.document.body.body, msg.timelines)
                    if (filter?.reason === 'word') {
                        setFilteredWord(filter.value)
                    } else if (filter?.reason === 'timeline') {
                        const tl = msg.postedTimelines?.find((timeline) => timeline.fqid === filter.value)
                        tl && setFilteredTimeline(tl.document.body.name)
                    }
                }
            })
            .catch((e) => {
                setError(e)
            })
            .finally(() => {
                setIsFetching(false)
            })
    }, [props.messageID, props.messageOwner, props.lastUpdated, forceUpdateCount])

    const style = useMemo(() => {
        if (!props.dimOnHover) return props.sx
        return {
            ...props.sx,
            '&:hover': {
                backgroundColor: alpha(theme.palette.divider, 0.05),
                transition: 'background-color 0.2s'
            }
        }
    }, [props.sx])

    if (filteredWord && !filterOverride) {
        return (
            <>
                <Box sx={props.sx}>
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1
                        }}
                    >
                        <Typography variant="caption" color="textDisabled">
                            {t('mutedByWord')}: {filteredWord}
                        </Typography>
                        <Typography
                            variant="caption"
                            color="textDisabled"
                            onClick={() => setFilterOverride(true)}
                            sx={{
                                cursor: 'pointer',
                                '&:hover': {
                                    textDecoration: 'underline'
                                }
                            }}
                        >
                            {t('show')}
                        </Typography>
                    </Box>
                </Box>
                {props.after}
            </>
        )
    }

    if (filteredTimeline && !filterOverride) {
        return (
            <>
                <Box sx={props.sx}>
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1
                        }}
                    >
                        <Typography variant="caption" color="textDisabled">
                            {t('mutedByTimeline')}: #{filteredTimeline}
                        </Typography>
                        <Typography
                            variant="caption"
                            color="textDisabled"
                            onClick={() => setFilterOverride(true)}
                            sx={{
                                cursor: 'pointer',
                                '&:hover': {
                                    textDecoration: 'underline'
                                }
                            }}
                        >
                            {t('show')}
                        </Typography>
                    </Box>
                </Box>
                {props.after}
            </>
        )
    }

    if (isFetching) {
        return (
            <>
                <Box sx={props.sx}>
                    <MessageSkeleton />
                </Box>
                {props.after}
            </>
        )
    }

    if (error) {
        if (error instanceof NotFoundError) {
            // 404
            return (
                <>
                    <Box display="flex" flexDirection="row" alignItems="center" gap={1} sx={props.sx}>
                        <Box
                            sx={{
                                width: '48px',
                                height: '1.2rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}
                            component={routerLink}
                            to={'/' + props.messageOwner}
                        >
                            <InfoIcon sx={{ fontSize: '1rem', color: 'text.disabled' }} />
                            <CCAvatarWithResolver
                                ccid={props.messageOwner}
                                sx={{
                                    width: '1.2rem',
                                    height: '1.2rem'
                                }}
                            />
                        </Box>
                        <Typography variant="caption" color="textDisabled">
                            {t('deletedMessage')}
                        </Typography>
                    </Box>
                    {props.after}
                </>
            )
        } else if (error instanceof PermissionError && devMode) {
            // 403
            return (
                <>
                    <Box display="flex" flexDirection="row" alignItems="center" gap={1} sx={props.sx}>
                        <Box
                            sx={{
                                width: '48px',
                                height: '1.2rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}
                            component={routerLink}
                            to={'/' + props.messageOwner}
                        >
                            <InfoIcon sx={{ fontSize: '1rem', color: 'text.disabled' }} />
                            <CCAvatarWithResolver
                                ccid={props.messageOwner}
                                sx={{
                                    width: '1.2rem',
                                    height: '1.2rem'
                                }}
                            />
                        </Box>
                        <Typography
                            variant="caption"
                            color="textDisabled"
                            onClick={() => navigator.clipboard.writeText(props.messageID)}
                        >
                            {t('privateMessage')}
                        </Typography>
                    </Box>
                    {props.after}
                </>
            )
        } else {
            if (devMode) {
                return (
                    <>
                        <Box
                            sx={{
                                ...props.sx
                            }}
                        >
                            <ContentWithUserFetch
                                ccid={props.messageOwner}
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flex: 1,
                                    mb: 1
                                }}
                            >
                                <Box
                                    display="flex"
                                    flexDirection="row"
                                    justifyContent="space-between"
                                    gap={1}
                                    width="100%"
                                >
                                    <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
                                        <SearchOffIcon />
                                        <Typography variant="caption">{error.message}</Typography>
                                    </Box>
                                    <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
                                        <TerminalIcon />
                                        <Typography variant="caption">{t('developerView')}</Typography>
                                    </Box>
                                </Box>
                                <Box display="flex" flexDirection="row" justifyContent="center" gap={1} width="100%">
                                    <Box display="flex" flexWrap="wrap" gap={1} flex={1}>
                                        <CopyChip label={'ID'} content={props.messageID} limit={20} />
                                        <CopyChip label={'Owner'} content={props.messageOwner} limit={20} />
                                        {props.resolveHint && (
                                            <CopyChip label={'ResolveHint'} content={props.resolveHint} limit={20} />
                                        )}
                                    </Box>
                                    <Box display="flex" flexDirection="row" alignItems="flex-end" gap={1}>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => {
                                                client.api.invalidateMessage(props.messageID)
                                                setError(null)
                                                setForceUpdateCount((prev) => prev + 1)
                                            }}
                                        >
                                            Reload
                                        </Button>
                                    </Box>
                                </Box>
                            </ContentWithUserFetch>
                        </Box>
                        {props.after}
                    </>
                )
            }
        }
    }

    if (!message) {
        return null
    }

    let body
    switch (message?.schema) {
        case Schemas.markdownMessage:
            body = (
                <Box sx={style} itemScope itemProp="hasPart" itemType="https://schema.org/SocialMediaPosting">
                    <meta itemProp="identifier" content={message.id} />
                    <meta itemProp="url" content={`https://concrnt.world/${message.author}/${message.id}`} />
                    <meta itemProp="datePublished" content={new Date(message.cdate).toISOString()} />
                    <MarkdownMessageView
                        simple={props.simple}
                        message={message as Message<MarkdownMessageSchema>}
                        lastUpdated={props.lastUpdated}
                        userCCID={client.ccid}
                        rerouted={props.rerouted}
                    />
                </Box>
            )
            break
        case Schemas.gfmMessage:
            body = (
                <Box sx={style} itemScope itemProp="hasPart" itemType="https://schema.org/SocialMediaPosting">
                    <meta itemProp="identifier" content={message.id} />
                    <meta itemProp="url" content={`https://concrnt.world/${message.author}/${message.id}`} />
                    <meta itemProp="datePublished" content={new Date(message.cdate).toISOString()} />
                    <GfmMessageView
                        simple={props.simple}
                        message={message as Message<MarkdownMessageSchema>}
                        lastUpdated={props.lastUpdated}
                        userCCID={client.ccid}
                        rerouted={props.rerouted}
                    />
                </Box>
            )
            break
        case Schemas.mfmMessage:
            body = (
                <Box sx={style} itemScope itemProp="hasPart" itemType="https://schema.org/SocialMediaPosting">
                    <meta itemProp="identifier" content={message.id} />
                    <meta itemProp="url" content={`https://concrnt.world/${message.author}/${message.id}`} />
                    <meta itemProp="datePublished" content={new Date(message.cdate).toISOString()} />
                    <MisskeyMessageView
                        simple={props.simple}
                        message={message as Message<MarkdownMessageSchema>}
                        lastUpdated={props.lastUpdated}
                        userCCID={client.ccid}
                        rerouted={props.rerouted}
                    />
                </Box>
            )
            break
        case Schemas.replyMessage:
            body = (
                <Box sx={style} itemScope itemProp="hasPart" itemType="https://schema.org/SocialMediaPosting">
                    <meta itemProp="identifier" content={message.id} />
                    <meta itemProp="url" content={`https://concrnt.world/${message.author}/${message.id}`} />
                    <meta itemProp="datePublished" content={new Date(message.cdate).toISOString()} />
                    <ReplyMessageFrame
                        simple={props.simple}
                        message={message as Message<ReplyMessageSchema>}
                        lastUpdated={props.lastUpdated}
                        userCCID={client.ccid}
                        rerouted={props.rerouted}
                    />
                </Box>
            )
            break
        case Schemas.rerouteMessage:
            body = (
                <Box sx={style} itemScope itemProp="hasPart" itemType="https://schema.org/SocialMediaPosting">
                    <meta itemProp="identifier" content={message.id} />
                    <meta itemProp="url" content={`https://concrnt.world/${message.author}/${message.id}`} />
                    <meta itemProp="datePublished" content={new Date(message.cdate).toISOString()} />
                    <RerouteMessageFrame
                        simple={props.simple}
                        message={message as Message<RerouteMessageSchema>}
                        lastUpdated={props.lastUpdated}
                    />
                </Box>
            )
            break
        case Schemas.plaintextMessage:
            body = (
                <Box sx={style} itemScope itemProp="hasPart" itemType="https://schema.org/SocialMediaPosting">
                    <meta itemProp="identifier" content={message.id} />
                    <meta itemProp="url" content={`https://concrnt.world/${message.author}/${message.id}`} />
                    <meta itemProp="datePublished" content={new Date(message.cdate).toISOString()} />
                    <PlainMessageView
                        simple={props.simple}
                        message={message as Message<PlaintextMessageSchema>}
                        lastUpdated={props.lastUpdated}
                        userCCID={client.ccid}
                        rerouted={props.rerouted}
                    />
                </Box>
            )
            break
        case Schemas.mediaMessage:
            body = (
                <Box sx={style} itemScope itemProp="hasPart" itemType="https://schema.org/SocialMediaPosting">
                    <meta itemProp="identifier" content={message.id} />
                    <meta itemProp="url" content={`https://concrnt.world/${message.author}/${message.id}`} />
                    <meta itemProp="datePublished" content={new Date(message.cdate).toISOString()} />
                    <MediaMessageView
                        simple={props.simple}
                        message={message as Message<MediaMessageSchema>}
                        lastUpdated={props.lastUpdated}
                        userCCID={client.ccid}
                        rerouted={props.rerouted}
                    />
                </Box>
            )
            break
        default:
            body = <Typography>unknown schema: {(message as any)?.schema ?? '<undefined>'}</Typography>
            break
    }

    return (
        <>
            {body}
            {props.after}
        </>
    )
})

MessageContainer.displayName = 'MessageContainer'
