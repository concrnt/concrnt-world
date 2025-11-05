import { useEffect, useState } from 'react'
import { Box, Button, Divider, Paper, Typography } from '@mui/material'
import { useParams, Link as NavLink } from 'react-router-dom'
import {
    type Association,
    Client,
    type MarkdownMessageSchema,
    type Message,
    type ReplyAssociationSchema,
    type ReplyMessageSchema,
    type RerouteMessageSchema,
    Schemas
} from '@concrnt/worldlib'
import { FullScreenLoading } from '../components/ui/FullScreenLoading'
import { ClientProvider } from '../context/ClientContext'
import TickerProvider from '../context/Ticker'

import { GuestBase } from '../components/GuestBase'
import { MediaViewerProvider } from '../context/MediaViewer'
import { MediaMessageView } from '../components/Message/MediaMessageView'
import { PlainMessageView } from '../components/Message/PlainMessageView'
import { Helmet } from 'react-helmet-async'
import { MessageSkeleton } from '../components/MessageSkeleton'
import { MarkdownMessageView } from '../components/Message/MarkdownMessageView'
import { useTranslation } from 'react-i18next'

export default function GuestMessagePage(): JSX.Element {
    const { authorID, messageID } = useParams()
    const lastUpdated = 0

    const [isFetching, setIsFetching] = useState<boolean>(true)
    const [message, setMessage] = useState<Message<
        MarkdownMessageSchema | ReplyMessageSchema | RerouteMessageSchema
    > | null>()

    const [replies, setReplies] = useState<
        Array<{
            association?: Association<ReplyAssociationSchema>
            message?: Message<ReplyMessageSchema>
        }>
    >([])

    const [replyTo, setReplyTo] = useState<Message<ReplyMessageSchema> | null>(null)

    const [client, initializeClient] = useState<Client>()
    const { t } = useTranslation('', { keyPrefix: 'pages.guestMessage' })
    useEffect(() => {
        if (!authorID || !messageID) return

        let isMounted = true
        Client.createAsGuest('ariake.concrnt.net').then((client) => {
            initializeClient(client)
            client
                .getMessage<any>(messageID, authorID)
                .then((msg) => {
                    if (!isMounted || !msg) return
                    setMessage(msg)

                    msg.getReplyMessages().then((replies) => {
                        if (!isMounted) return
                        setReplies(replies)
                    })

                    if (msg.schema === Schemas.replyMessage) {
                        msg.getReplyTo().then((replyTo) => {
                            if (!isMounted) return
                            setReplyTo(replyTo)
                        })
                    }
                })
                .finally(() => {
                    if (!isMounted) return
                    setIsFetching(false)
                })
        })

        return () => {
            isMounted = false
        }
    }, [authorID, messageID])

    if (!client) return <FullScreenLoading message="Loading..." />

    const providers = (childs: JSX.Element): JSX.Element => (
        <TickerProvider>
            <MediaViewerProvider>{childs}</MediaViewerProvider>
        </TickerProvider>
    )

    return providers(
        <>
            {message && (
                <Helmet>
                    <title>{`${message.authorProfile.username || 'anonymous'}: "${
                        message.document.body.body
                    }" - Concrnt`}</title>
                    <link
                        rel="canonical"
                        href={`https://concrnt.world/${message.authorProfile.alias ?? message.author}/${message.id}`}
                    />
                    <meta name="description" content={message.document.body.body} />
                </Helmet>
            )}
            <ClientProvider client={client}>
                <GuestBase
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        gap: 1,
                        flex: 1
                    }}
                    additionalButton={
                        <Button component={NavLink} to="/register">
                            {t('getStarted')}
                        </Button>
                    }
                >
                    <Paper
                        sx={{
                            flex: 1,
                            margin: { xs: 0.5, sm: 1 },
                            mb: { xs: 0, sm: '10px' },
                            display: 'flex',
                            flexFlow: 'column',
                            borderRadius: 2,
                            overflow: 'hidden',
                            background: 'none'
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                                padding: 1,
                                backgroundColor: 'background.paper',
                                minHeight: '100%',
                                overflow: 'scroll',
                                userSelect: 'text',
                                flex: 1
                            }}
                        >
                            <Box>
                                <Typography gutterBottom variant="h2">
                                    Message
                                </Typography>
                                <Divider />
                            </Box>

                            {isFetching && (
                                <>
                                    <Box>
                                        <MessageSkeleton />
                                    </Box>
                                    <Divider />
                                </>
                            )}

                            {!message && !isFetching && (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 1,
                                        padding: 1,
                                        alignItems: 'center'
                                    }}
                                >
                                    <Typography fontSize="4rem" fontWeight="bold">
                                        404
                                    </Typography>
                                    <Typography fontSize="2rem" fontWeight="bold">
                                        Message not found
                                    </Typography>
                                </Box>
                            )}

                            {message && (
                                <>
                                    {replyTo && (
                                        <>
                                            <Box
                                                itemScope
                                                itemProp="hasPart"
                                                itemType="https://schema.org/SocialMediaPosting"
                                            >
                                                <meta itemProp="identifier" content={message.id} />
                                                <meta
                                                    itemProp="url"
                                                    content={`https://concrnt.world/${message.author}/${message.id}`}
                                                />
                                                <meta
                                                    itemProp="datePublished"
                                                    content={new Date(message.cdate).toISOString()}
                                                />
                                                <MarkdownMessageView
                                                    message={replyTo}
                                                    lastUpdated={lastUpdated}
                                                    userCCID={client.ccid}
                                                />
                                            </Box>
                                            <Divider />
                                        </>
                                    )}

                                    {(message.schema === Schemas.markdownMessage ||
                                        message.schema === Schemas.replyMessage) && (
                                        <>
                                            <Box
                                                itemScope
                                                itemProp="hasPart"
                                                itemType="https://schema.org/SocialMediaPosting"
                                            >
                                                <meta itemProp="identifier" content={message.id} />
                                                <meta
                                                    itemProp="url"
                                                    content={`https://concrnt.world/${message.author}/${message.id}`}
                                                />
                                                <meta
                                                    itemProp="datePublished"
                                                    content={new Date(message.cdate).toISOString()}
                                                />
                                                <MarkdownMessageView
                                                    forceExpanded
                                                    message={
                                                        message as Message<MarkdownMessageSchema | ReplyMessageSchema>
                                                    }
                                                    lastUpdated={lastUpdated}
                                                    userCCID={client.ccid}
                                                />
                                            </Box>
                                            <Divider />
                                        </>
                                    )}

                                    {message.schema === Schemas.plaintextMessage && (
                                        <>
                                            <Box
                                                itemScope
                                                itemProp="hasPart"
                                                itemType="https://schema.org/SocialMediaPosting"
                                            >
                                                <meta itemProp="identifier" content={message.id} />
                                                <meta
                                                    itemProp="url"
                                                    content={`https://concrnt.world/${message.author}/${message.id}`}
                                                />
                                                <meta
                                                    itemProp="datePublished"
                                                    content={new Date(message.cdate).toISOString()}
                                                />
                                                <PlainMessageView
                                                    forceExpanded
                                                    message={
                                                        message as Message<MarkdownMessageSchema | ReplyMessageSchema>
                                                    }
                                                    lastUpdated={lastUpdated}
                                                    userCCID={client.ccid}
                                                />
                                            </Box>
                                            <Divider />
                                        </>
                                    )}

                                    {message.schema === Schemas.mediaMessage && (
                                        <>
                                            <Box
                                                itemScope
                                                itemProp="hasPart"
                                                itemType="https://schema.org/SocialMediaPosting"
                                            >
                                                <meta itemProp="identifier" content={message.id} />
                                                <meta
                                                    itemProp="url"
                                                    content={`https://concrnt.world/${message.author}/${message.id}`}
                                                />
                                                <meta
                                                    itemProp="datePublished"
                                                    content={new Date(message.cdate).toISOString()}
                                                />
                                                <MediaMessageView
                                                    forceExpanded
                                                    message={
                                                        message as Message<MarkdownMessageSchema | ReplyMessageSchema>
                                                    }
                                                    lastUpdated={lastUpdated}
                                                    userCCID={client.ccid}
                                                />
                                            </Box>
                                            <Divider />
                                        </>
                                    )}

                                    {replies.length > 0 && (
                                        <Box>
                                            <Typography variant="h2" gutterBottom>
                                                Replies:
                                            </Typography>
                                            <Box display="flex" flexDirection="column" gap={1}>
                                                {replies.map(
                                                    (reply) =>
                                                        reply.message && (
                                                            <>
                                                                <Box
                                                                    itemScope
                                                                    itemProp="hasPart"
                                                                    itemType="https://schema.org/SocialMediaPosting"
                                                                >
                                                                    <meta
                                                                        itemProp="identifier"
                                                                        content={reply.message.id}
                                                                    />
                                                                    <meta
                                                                        itemProp="url"
                                                                        content={`https://concrnt.world/${reply.message.author}/${reply.message.id}`}
                                                                    />
                                                                    <meta
                                                                        itemProp="datePublished"
                                                                        content={new Date(
                                                                            reply.message.cdate
                                                                        ).toISOString()}
                                                                    />
                                                                    <MarkdownMessageView
                                                                        message={reply.message}
                                                                        lastUpdated={lastUpdated}
                                                                        userCCID={client.ccid}
                                                                    />
                                                                </Box>
                                                                <Divider />
                                                            </>
                                                        )
                                                )}
                                            </Box>
                                        </Box>
                                    )}
                                </>
                            )}
                        </Box>
                    </Paper>
                </GuestBase>
            </ClientProvider>
        </>
    )
}
