import {
    type Message,
    type ReplyMessageSchema,
    type RerouteMessageSchema,
    Schemas,
    type MarkdownMessageSchema,
    type MediaMessageSchema,
    type PlaintextMessageSchema
} from '@concurrent-world/client'
import { useClient } from '../../context/ClientContext'
import { memo, useEffect, useState } from 'react'
import { ReplyMessageFrame } from './ReplyMessageFrame'
import { RerouteMessageFrame } from './RerouteMessageFrame'
import { MessageSkeleton } from '../MessageSkeleton'
import { Box, type SxProps, Typography, Button } from '@mui/material'
import { MessageView } from './MessageView'
import { usePreference } from '../../context/PreferenceContext'
import { ContentWithUserFetch } from '../ContentWithUserFetch'

import SearchOffIcon from '@mui/icons-material/SearchOff'
import TerminalIcon from '@mui/icons-material/Terminal'
import { CopyChip } from '../ui/CopyChip'
import { PlainMessageView } from './PlainMessageView'
import { MediaMessageView } from './MediaMessageView'

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
}

export const MessageContainer = memo<MessageContainerProps>((props: MessageContainerProps): JSX.Element | null => {
    const { client } = useClient()
    const [message, setMessage] = useState<Message<
        MarkdownMessageSchema | ReplyMessageSchema | RerouteMessageSchema | PlaintextMessageSchema | MediaMessageSchema
    > | null>()
    const [isFetching, setIsFetching] = useState<boolean>(true)
    const [devMode] = usePreference('devMode')
    const [forceUpdateCount, setForceUpdateCount] = useState<number>(0)
    const [_, setStaticUpdateCount] = useState<number>(0)
    const [error, setError] = useState<string | null>(null)

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
            })
            .catch((e) => {
                setError(e.toString())
            })
            .finally(() => {
                setIsFetching(false)
            })
    }, [props.messageID, props.messageOwner, props.lastUpdated, forceUpdateCount])

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

    if (!message && devMode) {
        if (!error) {
            // 404
            return (
                <Box
                    sx={{
                        ...props.sx,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }}
                >
                    <Box display="flex" justifyContent="space-between" mb={1}>
                        <Box display="flex" flexDirection="row" gap={1} width="100%" flexWrap="wrap" flex={1}>
                            <Typography>404</Typography>
                            <CopyChip label={'ID'} content={props.messageID} limit={20} />
                            <CopyChip label={'Owner'} content={props.messageOwner} limit={20} />
                            {props.resolveHint && (
                                <CopyChip label={'ResolveHint'} content={props.resolveHint} limit={20} />
                            )}
                        </Box>
                        <Box display="flex" justifyContent="center" alignItems="flex-start" gap={1} flexShrink={0}>
                            <TerminalIcon />
                            <Typography variant="caption">開発者ビュー</Typography>
                        </Box>
                    </Box>
                    {props.after}
                </Box>
            )
        } else {
            return (
                <Box
                    sx={{
                        ...props.sx,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
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
                        <Box display="flex" flexDirection="row" justifyContent="space-between" gap={1} width="100%">
                            <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
                                <SearchOffIcon />
                                <Typography variant="caption">{error}</Typography>
                            </Box>
                            <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
                                <TerminalIcon />
                                <Typography variant="caption">開発者ビュー</Typography>
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
                                        client.invalidateMessage(props.messageID)
                                        setForceUpdateCount((prev) => prev + 1)
                                    }}
                                >
                                    Reload
                                </Button>
                            </Box>
                        </Box>
                    </ContentWithUserFetch>
                    {props.after}
                </Box>
            )
        }
    } else if (!message && !devMode) {
        return null
    }

    let body
    switch (message?.schema) {
        case Schemas.markdownMessage:
            body = (
                <Box sx={props.sx} itemScope itemProp="hasPart" itemType="https://schema.org/SocialMediaPosting">
                    <meta itemProp="identifier" content={message.id} />
                    <meta itemProp="url" content={`https://concrnt.world/${message.author}/${message.id}`} />
                    <meta itemProp="datePublished" content={new Date(message.cdate).toISOString()} />
                    <MessageView
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
                <Box sx={props.sx} itemScope itemProp="hasPart" itemType="https://schema.org/SocialMediaPosting">
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
                <Box sx={props.sx} itemScope itemProp="hasPart" itemType="https://schema.org/SocialMediaPosting">
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
                <Box sx={props.sx} itemScope itemProp="hasPart" itemType="https://schema.org/SocialMediaPosting">
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
                <Box sx={props.sx} itemScope itemProp="hasPart" itemType="https://schema.org/SocialMediaPosting">
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
