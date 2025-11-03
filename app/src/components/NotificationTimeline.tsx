import {
    alpha,
    Box,
    Divider,
    IconButton,
    ListItem,
    ListItemIcon,
    ListItemText,
    type SxProps,
    Typography,
    useTheme
} from '@mui/material'
import React, { memo, useEffect, useState, useRef, forwardRef, type ForwardedRef } from 'react'
import { AssociationFrame } from './Association/AssociationFrame'
import { Loading } from './ui/Loading'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import HeartBrokenIcon from '@mui/icons-material/HeartBroken'
import { type Query, type QueryTimelineReader } from '@concrnt/client'
import { usePreference } from '../context/PreferenceContext'
import { VList, type VListHandle } from 'virtua'
import { useClient } from '../context/ClientContext'
import { PullToRefresh } from './PullToRefresh'
import {
    MarkdownMessageSchema,
    MediaMessageSchema,
    ReplyMessageSchema,
    Schemas,
    type Association,
    type Message
} from '@concrnt/worldlib'
import { CCAvatar } from './ui/CCAvatar'
import StarOutlineIcon from '@mui/icons-material/StarOutline'
import AddReactionIcon from '@mui/icons-material/AddReaction'
import { CfmRendererLite } from './ui/CfmRendererLite'
import { Link as routerLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export interface TimelineProps {
    timeline: string
    query: Query
    batchSize?: number
    perspective?: string
    header?: JSX.Element
    onScroll?: (top: number) => void
}

const divider = (
    <Divider
        variant="inset"
        component="li"
        sx={{
            mx: { xs: 0.5, sm: 1, md: 1 }
        }}
    />
)
const timelineElemSx: SxProps = {
    p: { xs: 0.5, sm: 1, md: 1 }
}

interface WrappedNotification {
    key: string
    type: 'summarised' | 'normal'
    item?: Association<any>
    items?: Association<any>[]
}

const timeline = forwardRef((props: TimelineProps, ref: ForwardedRef<VListHandle>): JSX.Element => {
    const { client } = useClient()
    const theme = useTheme()

    const timeline = useRef<QueryTimelineReader | null>(null)

    const [hasMoreData, setHasMoreData] = useState<boolean>(false)
    const [isFetching, setIsFetching] = useState<boolean>(false)

    const positionRef = useRef<number>(0)

    const [timelineLoading, setTimelineLoading] = useState<boolean>(true)

    const [notifications, setNotifications] = useState<WrappedNotification[]>([])

    const iter = useRef(0)

    const summariseNotifications = async (): Promise<WrappedNotification[]> => {
        if (!timeline.current) return []

        const newItems = timeline.current.body.slice(iter.current, timeline.current.body.length)
        iter.current = timeline.current.body.length

        const resolved = await Promise.all(
            newItems.map(async (e) => {
                return client.getAssociation<any>(e.resourceID, e.owner)
            })
        )

        const summarized = new Map<string, any[]>()

        for (const e of resolved) {
            if (!e) continue

            let key = ''

            switch (e.schema) {
                case Schemas.likeAssociation:
                case Schemas.reactionAssociation:
                    key = e.target + '$' + e.schema
                    break
                case Schemas.replyAssociation:
                case Schemas.rerouteAssociation:
                case Schemas.mentionAssociation:
                case Schemas.readAccessRequestAssociation:
                default:
                    key = e.id
            }

            if (summarized.get(key)) {
                summarized.get(key)!.push(e)
            } else {
                summarized.set(key, [e])
            }
        }

        const newNotifications: WrappedNotification[] = []

        for (const key of summarized.keys()) {
            const value = summarized.get(key)
            if (!value || value.length === 0) continue

            if (key.includes('$')) {
                // summarized
                newNotifications.push({
                    key: value[0].id,
                    type: 'summarised',
                    items: value
                })
            } else {
                newNotifications.push({
                    key: key,
                    type: 'normal',
                    item: value[0]
                })
            }
        }

        //
        return newNotifications
    }

    useEffect(() => {
        let isCancelled = false
        setTimelineLoading(true)
        const request = async () => {
            return client.newTimelineQuery().then((t) => {
                if (isCancelled) return
                timeline.current = t
                setNotifications([])
                iter.current = 0
                timeline.current
                    .init(props.timeline, props.query, props.batchSize ?? 16)
                    .then((hasMore) => {
                        if (isCancelled) return
                        setHasMoreData(hasMore)
                        summariseNotifications().then((n) => {
                            if (isCancelled) return
                            setNotifications(n)
                        })
                    })
                    .finally(() => {
                        if (isCancelled) return
                        setTimelineLoading(false)
                    })
                return t
            })
        }
        const mt = request()
        return () => {
            isCancelled = true
            mt.then((t) => {
                if (t) t.onUpdate = () => {}
            })
        }
    }, [props.timeline, props.query, client])

    const count = notifications.length
    let alreadyFetchInThisRender = false

    const readMore = (): void => {
        if (isFetching || alreadyFetchInThisRender) return
        setIsFetching(true)
        alreadyFetchInThisRender = true

        timeline.current
            ?.readMore()
            .then((hasMore) => {
                setHasMoreData(hasMore)
                alreadyFetchInThisRender = false
                summariseNotifications().then((n) => {
                    setNotifications((prev) => [...prev, ...n])
                })
            })
            .finally(() => {
                setIsFetching(false)
                alreadyFetchInThisRender = false
            })
    }

    const onRefresh = async (): Promise<void> => {
        setIsFetching(true)
        setHasMoreData(false)
        setNotifications([])
        iter.current = 0
        const hasMore = (await timeline.current?.reload()) ?? false
        setHasMoreData(hasMore)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setIsFetching(false)
    }

    return (
        <PullToRefresh positionRef={positionRef} isFetching={isFetching} onRefresh={onRefresh}>
            <VList
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    listStyle: 'none',
                    overflowX: 'hidden',
                    overflowY: 'auto',
                    overscrollBehaviorY: 'none',
                    scrollbarGutter: 'stable'
                }}
                onScroll={(top) => {
                    positionRef.current = top
                    props.onScroll?.(top)
                }}
                onRangeChange={(_, end) => {
                    if (end + 3 > count && hasMoreData) readMore()
                }}
                ref={ref}
            >
                {props.header}

                {(notifications.length ?? 0) === 0
                    ? !timelineLoading && (
                          <Box
                              sx={{
                                  width: '100%',
                                  display: 'flex',
                                  justifyContent: 'center'
                              }}
                          >
                              <Typography
                                  sx={{
                                      color: 'text.secondary'
                                  }}
                              >
                                  No currents yet here!
                              </Typography>
                          </Box>
                      )
                    : (timelineLoading ? [] : notifications).map((e) => {
                          let element
                          switch (e.type) {
                              case 'summarised':
                                  const schema = e.items?.[0].schema
                                  switch (schema) {
                                      case Schemas.likeAssociation:
                                          element = <SummarisedLike items={e.items!} />
                                          break
                                      case Schemas.reactionAssociation:
                                          element = <SummarisedReaction items={e.items!} />
                                          break
                                  }
                                  break
                              case 'normal':
                                  element = (
                                      <AssociationFrame
                                          dimOnHover
                                          sx={timelineElemSx}
                                          associationID={e.item!.id}
                                          associationOwner={e.item!.owner}
                                          after={divider}
                                          lastUpdated={0}
                                          perspective={props.perspective}
                                      />
                                  )
                                  break
                          }

                          return (
                              <React.Fragment key={e.key}>
                                  <ErrorBoundary FallbackComponent={renderError}>
                                      {element}
                                      {divider}
                                  </ErrorBoundary>
                              </React.Fragment>
                          )
                      })}

                {!timelineLoading && isFetching && (
                    <Loading key={0} message="Loading..." color={theme.palette.text.primary} />
                )}
            </VList>
        </PullToRefresh>
    )
})
timeline.displayName = 'timeline'

const renderError = ({ error }: FallbackProps): JSX.Element => {
    const [isDevMode] = usePreference('devMode')
    const { t } = useTranslation()
    if (!isDevMode) return <></>
    return (
        <ListItem>
            <ListItemIcon>
                <HeartBrokenIcon />
            </ListItemIcon>
            <ListItemText
                primary={t('common.failedToRender')}
                secondary={
                    <Box>
                        {error?.message}
                        <pre>{error?.stack}</pre>
                    </Box>
                }
            />
        </ListItem>
    )
}

export const NotificationTimeline = memo(timeline)
NotificationTimeline.displayName = 'NotificationTimeline'

const SummarisedLike = (props: { items: Association<any>[] }) => {
    const theme = useTheme()
    const navigate = useNavigate()

    const { t } = useTranslation('', { keyPrefix: 'pages.notifications' })

    const [target, setTarget] = useState<Message<
        MarkdownMessageSchema | ReplyMessageSchema | MediaMessageSchema
    > | null>(null)

    useEffect(() => {
        props.items[0].getTargetMessage().then(setTarget)
    }, [props.items])

    return (
        <ListItem
            sx={{
                wordBreak: 'break-word',
                alignItems: 'flex-start',
                flex: 1,
                gap: { xs: 0.5, sm: 1 },
                p: { xs: 0.5, sm: 1, md: 1 },
                '&:hover': {
                    backgroundColor: alpha(theme.palette.divider, 0.05),
                    transition: 'background-color 0.2s'
                }
            }}
            disablePadding
            onClick={() => {
                const selectedString = window.getSelection()?.toString()
                if (selectedString !== '') return
                navigate(`/${target?.author}/${target?.id}`)
            }}
        >
            <Box
                sx={{
                    width: '48px',
                    display: 'flex',
                    justifyContent: 'flex-end'
                }}
            >
                <StarOutlineIcon
                    sx={{
                        width: '30px',
                        height: '30px'
                    }}
                />
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    flex: 1,
                    flexDirection: 'column',
                    width: '100%',
                    overflow: 'hidden',
                    gap: { xs: 0.5, sm: 1 }
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 1
                    }}
                >
                    {props.items?.map((item) => (
                        <IconButton
                            key={item.id}
                            to={
                                item.document.meta?.apActorId
                                    ? `/ap/${item.document.meta.apActorId}`
                                    : `/${item.author}`
                            }
                            component={routerLink}
                            onClick={(e) => e.stopPropagation()}
                            sx={{ p: 0 }}
                        >
                            <CCAvatar
                                circle
                                avatarURL={item.authorProfile.avatar}
                                sx={{
                                    width: { width: '32px', height: '32px' }
                                }}
                            />
                        </IconButton>
                    ))}
                </Box>
                <Box>
                    {props.items.length === 1 ? (
                        <Typography>
                            {t('favorite', {
                                name: props.items[0].authorProfile.username
                            })}
                        </Typography>
                    ) : (
                        <Typography>
                            {t('favoriteMany', {
                                name: props.items[0].authorProfile.username,
                                count: props.items.length - 1
                            })}
                        </Typography>
                    )}

                    <Typography variant="caption">
                        <CfmRendererLite
                            messagebody={target?.document.body.body ?? 'no content'}
                            emojiDict={target?.document.body.emojis ?? {}}
                        />
                    </Typography>
                </Box>
            </Box>
        </ListItem>
    )
}

const SummarisedReaction = (props: { items: Association<any>[] }) => {
    const theme = useTheme()
    const navigate = useNavigate()
    const { t } = useTranslation('', { keyPrefix: 'pages.notifications' })

    const [target, setTarget] = useState<Message<
        MarkdownMessageSchema | ReplyMessageSchema | MediaMessageSchema
    > | null>(null)

    useEffect(() => {
        props.items[0].getTargetMessage().then(setTarget)
    }, [props.items])

    const reactions: Record<string, Association<any>[]> = {}
    for (const item of props.items) {
        if (item.variant in reactions) {
            reactions[item.variant].push(item)
        } else {
            reactions[item.variant] = [item]
        }
    }

    return (
        <ListItem
            sx={{
                wordBreak: 'break-word',
                alignItems: 'flex-start',
                flex: 1,
                gap: { xs: 0.5, sm: 1 },
                p: { xs: 0.5, sm: 1, md: 1 },
                '&:hover': {
                    backgroundColor: alpha(theme.palette.divider, 0.05),
                    transition: 'background-color 0.2s'
                }
            }}
            disablePadding
            onClick={() => {
                const selectedString = window.getSelection()?.toString()
                if (selectedString !== '') return
                navigate(`/${target?.author}/${target?.id}`)
            }}
        >
            <Box
                sx={{
                    width: '48px',
                    display: 'flex',
                    justifyContent: 'flex-end'
                }}
            >
                <AddReactionIcon
                    sx={{
                        width: '30px',
                        height: '30px'
                    }}
                />
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    flex: 1,
                    flexDirection: 'column',
                    width: '100%',
                    overflow: 'hidden',
                    gap: { xs: 0.5, sm: 1 }
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 1,
                        flexWrap: 'wrap'
                    }}
                >
                    {Object.entries(reactions).map(([key, value]) => {
                        return (
                            <Box key={key} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                                    <img src={key} style={{ width: '32px', height: '32px' }} />
                                    {value.map((item) => (
                                        <IconButton
                                            key={item.id}
                                            to={
                                                item.document.meta?.apActorId
                                                    ? `/ap/${item.document.meta.apActorId}`
                                                    : `/${item.author}`
                                            }
                                            component={routerLink}
                                            onClick={(e) => e.stopPropagation()}
                                            sx={{ p: 0 }}
                                        >
                                            <CCAvatar
                                                circle
                                                avatarURL={item.authorProfile.avatar}
                                                sx={{
                                                    width: { width: '32px', height: '32px' }
                                                }}
                                            />
                                        </IconButton>
                                    ))}
                                </Box>
                                <Divider orientation="vertical" />
                            </Box>
                        )
                    })}
                </Box>
                <Box>
                    {props.items.length === 1 ? (
                        <Typography>
                            {t('reaction', {
                                name: props.items[0].authorProfile.username
                            })}
                        </Typography>
                    ) : (
                        <Typography>
                            {t('reactionMany', {
                                name: props.items[0].authorProfile.username,
                                count: props.items.length - 1
                            })}
                        </Typography>
                    )}
                    <Typography variant="caption">
                        <CfmRendererLite
                            messagebody={target?.document.body.body ?? 'no content'}
                            emojiDict={target?.document.body.emojis ?? {}}
                        />
                    </Typography>
                </Box>
            </Box>
        </ListItem>
    )
}
