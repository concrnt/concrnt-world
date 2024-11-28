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
} from '@concurrent-world/client'
import { FullScreenLoading } from '../components/ui/FullScreenLoading'
import { ClientProvider } from '../context/ClientContext'
import TickerProvider from '../context/Ticker'

import { GuestBase } from '../components/GuestBase'
import { MediaViewerProvider } from '../context/MediaViewer'
import { MessageView } from '../components/Message/MessageView'
import { MediaMessageView } from '../components/Message/MediaMessageView'
import { PlainMessageView } from '../components/Message/PlainMessageView'
import { Helmet } from 'react-helmet-async'

export default function GuestMessagePage(): JSX.Element {
    const { authorID, messageID } = useParams()
    const lastUpdated = 0

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
    useEffect(() => {
        if (!authorID || !messageID) return
        const client = new Client('ariake.concrnt.net')
        initializeClient(client)

        let isMounted = true
        client.getMessage<any>(messageID, authorID).then((msg) => {
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

    if (!message) return <></>

    return providers(
        <>
            <Helmet>
                <title>{`${message.authorUser?.profile?.username || 'anonymous'}: "${
                    message.document.body.body
                }" - Concrnt`}</title>
                <meta name="description" content={message.document.body.body} />
                <script type="application/ld+json">
                    {`
            {
                "@context": "https://schema.org",
                "@type": "SocialMediaPosting",
                "articleBody": ${JSON.stringify(message.document.body.body)},
                "url": "${window.location.href}",
                "author": {
                    "@type": "Person",
                    "name": "${message.authorUser?.profile?.username || 'anonymous'}",
                    "url": "https://concrnt.world/${message.author}"
                    "image": "${message.authorUser?.profile?.avatar}",
                    "description": ${JSON.stringify(message.authorUser?.profile?.description || '')},
                }
            }
            `}
                </script>
            </Helmet>
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
                            はじめる
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

                            {replyTo && (
                                <>
                                    <Box>
                                        <MessageView
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
                                    <Box>
                                        <MessageView
                                            forceExpanded
                                            message={message as Message<MarkdownMessageSchema | ReplyMessageSchema>}
                                            lastUpdated={lastUpdated}
                                            userCCID={client.ccid}
                                        />
                                    </Box>
                                    <Divider />
                                </>
                            )}

                            {message.schema === Schemas.plaintextMessage && (
                                <>
                                    <Box>
                                        <PlainMessageView
                                            forceExpanded
                                            message={message as Message<MarkdownMessageSchema | ReplyMessageSchema>}
                                            lastUpdated={lastUpdated}
                                            userCCID={client.ccid}
                                        />
                                    </Box>
                                    <Divider />
                                </>
                            )}

                            {message.schema === Schemas.mediaMessage && (
                                <>
                                    <Box>
                                        <MediaMessageView
                                            forceExpanded
                                            message={message as Message<MarkdownMessageSchema | ReplyMessageSchema>}
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
                                                        <MessageView
                                                            message={reply.message}
                                                            lastUpdated={lastUpdated}
                                                            userCCID={client.ccid}
                                                        />
                                                        <Divider />
                                                    </>
                                                )
                                        )}
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </GuestBase>
            </ClientProvider>
        </>
    )
}
