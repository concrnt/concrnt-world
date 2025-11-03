import {
    Box,
    Button,
    Divider,
    List,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Paper,
    Tab,
    Tabs,
    Typography
} from '@mui/material'
import { Link, useParams } from 'react-router-dom'
import { useClient } from '../context/ClientContext'
import { useEffect, useState } from 'react'
import {
    type Message,
    type ReplyMessageSchema,
    type RerouteMessageSchema,
    Schemas,
    type MarkdownMessageSchema,
    type Association,
    type LikeAssociationSchema,
    type ReactionAssociationSchema,
    type ReplyAssociationSchema,
    type RerouteAssociationSchema
} from '@concrnt/worldlib'
import { RerouteMessageFrame } from '../components/Message/RerouteMessageFrame'
import { FavoriteAssociation } from '../components/Association/FavoriteAssociation'
import { ReactionAssociation } from '../components/Association/ReactionAssociation'

import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import { useGlobalState } from '../context/GlobalState'
import { CCPostEditor } from '../components/Editor/CCPostEditor'
import { PlainMessageView } from '../components/Message/PlainMessageView'
import { MediaMessageView } from '../components/Message/MediaMessageView'
import { Helmet } from 'react-helmet-async'
import { MessageSkeleton } from '../components/MessageSkeleton'
import { MarkdownMessageView } from '../components/Message/MarkdownMessageView'
import { GfmMessageView } from '../components/Message/GfmMessageView'
import { MisskeyMessageView } from '../components/Message/MisskeyMessageView'
import { useTranslation } from 'react-i18next'

export function MessagePage(): JSX.Element {
    const { authorID, messageID } = useParams()
    const { t } = useTranslation('', { keyPrefix: 'pages.associations' })
    const { client } = useClient()
    const lastUpdated = 0

    const { allKnownTimelines, isMobileSize } = useGlobalState()

    const [message, setMessage] = useState<Message<
        MarkdownMessageSchema | ReplyMessageSchema | RerouteMessageSchema
    > | null>()
    const [_, setStaticUpdateCount] = useState<number>(0)

    if (message) {
        message.onUpdate = () => {
            setStaticUpdateCount((prev) => prev + 1)
        }
    }

    const [isFetching, setIsFetching] = useState<boolean>(true)

    const [replies, setReplies] = useState<
        Array<{
            association?: Association<ReplyAssociationSchema>
            message?: Message<ReplyMessageSchema>
        }>
    >([])
    const [reroutes, setReroutes] = useState<
        Array<{
            association?: Association<RerouteAssociationSchema>
            message?: Message<RerouteMessageSchema>
        }>
    >([])
    const [favorites, setFavorites] = useState<Array<Association<LikeAssociationSchema>>>([])
    const [reactions, setReactions] = useState<Array<Association<ReactionAssociationSchema>>>([])
    const [replyTo, setReplyTo] = useState<Message<ReplyMessageSchema> | null>(null)

    const tab = (location.hash.slice(1) as 'replies' | 'reroutes' | 'favorites' | 'reactions') || 'replies'

    const [forceUpdate, setForceUpdate] = useState(0) // FIXME: use more elegant way to force update

    useEffect(() => {
        setMessage(null)
        setReplies([])
        setReplyTo(null)

        let isMounted = true
        if (!messageID || !authorID) return
        client
            .getMessage<any>(messageID, authorID)
            .then((msg) => {
                if (!isMounted || !msg) return
                setMessage(msg)

                msg.getReplyMessages().then((replies) => {
                    if (!isMounted) return
                    setReplies(replies)
                })

                msg.getRerouteMessages().then((reroutes) => {
                    if (!isMounted) return
                    setReroutes(reroutes)
                })

                msg.getFavorites().then((favorites) => {
                    if (!isMounted) return
                    setFavorites(favorites)
                })

                msg.getReactions().then((reactions) => {
                    if (!isMounted) return
                    setReactions(reactions)
                })

                if (msg.schema === Schemas.replyMessage) {
                    msg.getReplyTo().then((replyTo) => {
                        if (!isMounted) return
                        setReplyTo(replyTo)
                    })
                }
            })
            .finally(() => {
                setIsFetching(false)
            })

        return () => {
            isMounted = false
        }
    }, [messageID, authorID, forceUpdate])

    return (
        <>
            {message && (
                <Helmet>
                    <title>{`${message.authorProfile.username || 'anonymous'}: "${
                        message.document.body.body
                    }" - Concrnt`}</title>
                    <meta name="description" content={message.document.body.body} />
                </Helmet>
            )}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    padding: 1,
                    backgroundColor: 'background.paper',
                    minHeight: '100%',
                    overflow: 'scroll',
                    userSelect: 'text'
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
                        <Button variant="text" color="primary" component={Link} to="/">
                            Back to Home
                        </Button>
                    </Box>
                )}

                {message && (
                    <>
                        {replyTo && (
                            <>
                                <Box>
                                    <MarkdownMessageView
                                        message={replyTo}
                                        lastUpdated={lastUpdated}
                                        userCCID={client.ccid}
                                    />
                                </Box>
                                <Divider />
                            </>
                        )}

                        {(message.schema === Schemas.markdownMessage || message.schema === Schemas.replyMessage) && (
                            <>
                                <Box>
                                    <MarkdownMessageView
                                        forceExpanded
                                        message={message as Message<MarkdownMessageSchema | ReplyMessageSchema>}
                                        lastUpdated={lastUpdated}
                                        userCCID={client.ccid}
                                    />
                                </Box>
                                <Divider />
                            </>
                        )}

                        {message.schema === Schemas.gfmMessage && (
                            <>
                                <Box>
                                    <GfmMessageView
                                        forceExpanded
                                        message={message as Message<MarkdownMessageSchema | ReplyMessageSchema>}
                                        lastUpdated={lastUpdated}
                                        userCCID={client.ccid}
                                    />
                                </Box>
                                <Divider />
                            </>
                        )}

                        {message.schema === Schemas.mfmMessage && (
                            <>
                                <Box>
                                    <MisskeyMessageView
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
                    </>
                )}

                <Tabs
                    value={tab}
                    onChange={(_, next) => {
                        location.hash = next
                    }}
                    textColor="secondary"
                    indicatorColor="secondary"
                    variant={isMobileSize ? 'fullWidth' : 'standard'}
                >
                    <Tab
                        value="replies"
                        label="Replies"
                        sx={{
                            fontSize: '0.9rem',
                            padding: '0',
                            textTransform: 'none',
                            minWidth: { xs: '0', sm: '80px' }
                        }}
                    />
                    <Tab
                        value="reroutes"
                        label="Reroutes"
                        sx={{
                            fontSize: '0.9rem',
                            padding: '0',
                            textTransform: 'none',
                            minWidth: { xs: '0', sm: '80px' }
                        }}
                    />
                    <Tab
                        value="favorites"
                        label="Favorites"
                        sx={{
                            fontSize: '0.9rem',
                            padding: '0',
                            textTransform: 'none',
                            minWidth: { xs: '0', sm: '80px' }
                        }}
                    />
                    <Tab
                        value="reactions"
                        label="Reactions"
                        sx={{
                            fontSize: '0.9rem',
                            padding: '0',
                            textTransform: 'none',
                            minWidth: { xs: '0', sm: '80px' }
                        }}
                    />
                </Tabs>
                <Divider />

                {message && (
                    <>
                        {tab === 'replies' && (
                            <>
                                <Paper variant="outlined">
                                    <CCPostEditor
                                        minRows={3}
                                        maxRows={7}
                                        streamPickerInitial={
                                            message.postedTimelines?.filter(
                                                (t) => t.schema === Schemas.communityTimeline
                                            ) ?? []
                                        }
                                        streamPickerOptions={allKnownTimelines}
                                        placeholder="Write a reply..."
                                        actionTo={message}
                                        mode="reply"
                                        sx={{
                                            p: 1
                                        }}
                                    />
                                </Paper>
                                {replies.length > 0 && (
                                    <>
                                        <Typography variant="h2" gutterBottom>
                                            Replies:
                                        </Typography>
                                        {replies.map(
                                            (reply) =>
                                                reply.association &&
                                                reply.message && (
                                                    <Paper
                                                        key={reply.message.id}
                                                        sx={{
                                                            padding: '20px'
                                                        }}
                                                    >
                                                        <MarkdownMessageView
                                                            message={reply.message}
                                                            lastUpdated={lastUpdated}
                                                            userCCID={client.ccid}
                                                            additionalMenuItems={
                                                                reply.association.author === client.ccid ||
                                                                reply.association.owner === client.ccid ? (
                                                                    <MenuItem
                                                                        onClick={() => {
                                                                            reply.association?.delete().then(() => {
                                                                                setForceUpdate((prev) => prev + 1)
                                                                            })
                                                                        }}
                                                                    >
                                                                        <ListItemIcon>
                                                                            <DeleteForeverIcon
                                                                                sx={{ color: 'text.primary' }}
                                                                            />
                                                                        </ListItemIcon>
                                                                        <ListItemText>
                                                                            {t('removeAssociation')}
                                                                        </ListItemText>
                                                                    </MenuItem>
                                                                ) : undefined
                                                            }
                                                        />
                                                    </Paper>
                                                )
                                        )}
                                    </>
                                )}
                            </>
                        )}
                        {tab === 'reroutes' && (
                            <>
                                <Typography variant="h2" gutterBottom>
                                    Reroutes:
                                </Typography>
                                {reroutes.length > 0 && (
                                    <>
                                        {reroutes.map(
                                            (reroute) =>
                                                reroute.association &&
                                                reroute.message && (
                                                    <Paper
                                                        key={reroute.message.id}
                                                        sx={{
                                                            padding: '20px'
                                                        }}
                                                    >
                                                        <RerouteMessageFrame
                                                            message={reroute.message}
                                                            additionalMenuItems={
                                                                reroute.association.author === client.ccid ||
                                                                reroute.association.owner === client.ccid ? (
                                                                    <MenuItem
                                                                        onClick={() => {
                                                                            reroute.association?.delete().then(() => {
                                                                                setForceUpdate((prev) => prev + 1)
                                                                            })
                                                                        }}
                                                                    >
                                                                        <ListItemIcon>
                                                                            <DeleteForeverIcon
                                                                                sx={{ color: 'text.primary' }}
                                                                            />
                                                                        </ListItemIcon>
                                                                        <ListItemText>
                                                                            {t('removeAssociation')}
                                                                        </ListItemText>
                                                                    </MenuItem>
                                                                ) : undefined
                                                            }
                                                        />
                                                    </Paper>
                                                )
                                        )}
                                    </>
                                )}
                            </>
                        )}
                        {tab === 'favorites' && (
                            <>
                                <Typography variant="h2" gutterBottom>
                                    Favorites:
                                </Typography>
                                <List>
                                    {favorites.map((favorite) => (
                                        <FavoriteAssociation
                                            key={favorite.id}
                                            association={favorite}
                                            perspective={client.ccid}
                                        />
                                    ))}
                                </List>
                            </>
                        )}
                        {tab === 'reactions' && (
                            <>
                                <Typography variant="h2" gutterBottom>
                                    Reactions:
                                </Typography>
                                <List>
                                    {reactions.map((reaction) => (
                                        <ReactionAssociation
                                            key={reaction.id}
                                            association={reaction}
                                            perspective={client.ccid}
                                        />
                                    ))}
                                </List>
                            </>
                        )}
                    </>
                )}
            </Box>
        </>
    )
}
