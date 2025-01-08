import { Box, Divider, ListItem, ListItemIcon, ListItemText, type SxProps, Typography, useTheme } from '@mui/material'
import React, { memo, useCallback, useEffect, useState, useRef, forwardRef, type ForwardedRef } from 'react'
import { AssociationFrame } from '../Association/AssociationFrame'
import { Loading } from '../ui/Loading'
import { MessageContainer } from '../Message/MessageContainer'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import HeartBrokenIcon from '@mui/icons-material/HeartBroken'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import SyncIcon from '@mui/icons-material/Sync'
import { type TimelineReader } from '@concurrent-world/client'
import { useRefWithForceUpdate } from '../../hooks/useRefWithForceUpdate'
import useSound from 'use-sound'
import { usePreference } from '../../context/PreferenceContext'
import { VList, type VListHandle } from 'virtua'
import { useClient } from '../../context/ClientContext'
import { UseSoundFormats } from '../../constants'

export interface TimelineProps {
    streams: string[]
    perspective?: string
    header?: JSX.Element
    onScroll?: (top: number) => void
    noRealtime?: boolean
}

const PTR_HEIGHT = 60

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

const timeline = forwardRef((props: TimelineProps, ref: ForwardedRef<VListHandle>): JSX.Element => {
    const { client } = useClient()
    const theme = useTheme()
    const [sound] = usePreference('sound')

    const [timeline, timelineChanged] = useRefWithForceUpdate<TimelineReader | null>(null)

    const [hasMoreData, setHasMoreData] = useState<boolean>(false)
    const [isFetching, setIsFetching] = useState<boolean>(false)

    const [touchPosition, setTouchPosition] = useState<number>(0)
    const [loaderSize, setLoaderSize] = useState<number>(0)
    const [loadable, setLoadable] = useState<boolean>(false)
    const [ptrEnabled, setPtrEnabled] = useState<boolean>(false)

    const [playBubble] = useSound(sound.post, {
        volume: sound.volume / 100,
        interrupt: false,
        format: UseSoundFormats
    })
    const playBubbleRef = useRef(playBubble)

    const [timelineLoading, setTimelineLoading] = useState<boolean>(true)

    useEffect(() => {
        playBubbleRef.current = playBubble
    }, [playBubble])

    useEffect(() => {
        let isCancelled = false
        if (props.streams.length === 0) return
        setTimelineLoading(true)
        const mt = client
            .newTimelineReader({
                withoutSocket: props.noRealtime ?? false
            })
            .then((t) => {
                if (isCancelled) return
                timeline.current = t
                t.onUpdate = () => {
                    timelineChanged()
                }
                t.onRealtimeEvent = (event) => {
                    if (event.document?.type === 'message') {
                        playBubbleRef.current()
                    }
                }
                timeline.current
                    .listen(props.streams)
                    .then((hasMore) => {
                        setHasMoreData(hasMore)
                    })
                    .finally(() => {
                        setTimelineLoading(false)
                    })
                return t
            })
        return () => {
            isCancelled = true
            mt.then((t) => {
                t?.dispose()
            })
        }
    }, [props.streams])

    const positionRef = useRef<number>(0)
    const scrollParentRef = useRef<HTMLDivElement>(null)

    const onTouchStart = useCallback((raw: Event) => {
        const e = raw as TouchEvent
        setTouchPosition(e.touches[0].clientY)
        setLoadable(positionRef.current === 0)
    }, [])

    const onTouchMove = useCallback(
        (raw: Event) => {
            if (!loadable) return
            const e = raw as TouchEvent
            if (!scrollParentRef.current) return
            const delta = e.touches[0].clientY - touchPosition
            setLoaderSize(Math.min(Math.max(delta, 0), PTR_HEIGHT))
            if (delta >= PTR_HEIGHT) setPtrEnabled(true)
        },
        [scrollParentRef.current, touchPosition]
    )

    const onTouchEnd = useCallback(() => {
        setLoaderSize(0)
        if (ptrEnabled) {
            if (isFetching) {
                setPtrEnabled(false)
                return
            }
            setIsFetching(true)
            setHasMoreData(false)
            setTimeout(() => {
                timeline.current?.reload().then((hasMore) => {
                    setHasMoreData(hasMore)
                    setIsFetching(false)
                    setPtrEnabled(false)
                })
            }, 1000)
        }
    }, [ptrEnabled, setPtrEnabled, props.streams, client.api, isFetching])

    useEffect(() => {
        if (!scrollParentRef.current) return
        scrollParentRef.current.addEventListener('touchstart', onTouchStart)
        scrollParentRef.current.addEventListener('touchmove', onTouchMove)
        scrollParentRef.current.addEventListener('touchend', onTouchEnd)
        return () => {
            scrollParentRef.current?.removeEventListener('touchstart', onTouchStart)
            scrollParentRef.current?.removeEventListener('touchmove', onTouchMove)
            scrollParentRef.current?.removeEventListener('touchend', onTouchEnd)
        }
    }, [scrollParentRef.current, onTouchStart, onTouchMove, onTouchEnd])

    const count = timeline.current?.body.length ?? 0
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
            })
            .finally(() => {
                setIsFetching(false)
                alreadyFetchInThisRender = false
            })
    }

    return (
        <>
            <Box
                sx={{
                    height: `${ptrEnabled ? PTR_HEIGHT : loaderSize}px`,
                    width: '100%',
                    position: 'relative',
                    color: 'text.secondary',
                    display: 'flex',
                    transition: 'height 0.2s ease-in-out',
                    overflow: 'hidden'
                }}
            >
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    height={`${PTR_HEIGHT}px`}
                    position="absolute"
                    width="100%"
                    bottom="0"
                    left="0"
                >
                    {isFetching ? (
                        <SyncIcon
                            sx={{
                                animation: 'spin 1s linear infinite',
                                '@keyframes spin': {
                                    '0%': { transform: 'rotate(0deg)' },
                                    '100%': { transform: 'rotate(-360deg)' }
                                }
                            }}
                        />
                    ) : (
                        <ArrowUpwardIcon
                            sx={{
                                transform: `rotate(${ptrEnabled ? 0 : 180}deg)`,
                                transition: 'transform 0.2s ease-in-out'
                            }}
                        />
                    )}
                </Box>
            </Box>
            <Box
                ref={scrollParentRef}
                sx={{
                    display: 'flex',
                    flex: 1,
                    overflow: 'hidden',
                    flexDirection: 'column'
                }}
            >
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

                    {(timeline.current?.body.length ?? 0) === 0
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
                        : (timelineLoading ? [] : timeline.current?.body ?? []).map((e) => {
                              let element
                              const type = e.resourceID[0]
                              switch (type) {
                                  case 'm':
                                      element = (
                                          <MessageContainer
                                              dimOnHover
                                              sx={timelineElemSx}
                                              messageID={e.resourceID}
                                              messageOwner={e.owner}
                                              resolveHint={e.timelineID.split('@')[1]}
                                              lastUpdated={e.lastUpdate?.getTime() ?? 0}
                                              after={divider}
                                              timestamp={e.cdate}
                                          />
                                      )
                                      break
                                  case 'a':
                                      element = (
                                          <AssociationFrame
                                              dimOnHover
                                              sx={timelineElemSx}
                                              associationID={e.resourceID}
                                              associationOwner={e.owner}
                                              lastUpdated={e.lastUpdate?.getTime() ?? 0}
                                              after={divider}
                                              perspective={props.perspective}
                                          />
                                      )
                                      break
                                  default:
                                      element = <Typography>Unknown message type: {type}</Typography>
                                      break
                              }

                              return (
                                  <React.Fragment key={e.resourceID}>
                                      <ErrorBoundary FallbackComponent={renderError}>{element}</ErrorBoundary>
                                  </React.Fragment>
                              )
                          })}

                    {!timelineLoading && isFetching && (
                        <Loading key={0} message="Loading..." color={theme.palette.text.primary} />
                    )}
                </VList>
            </Box>
        </>
    )
})
timeline.displayName = 'timeline'

const renderError = ({ error }: FallbackProps): JSX.Element => {
    const [isDevMode] = usePreference('devMode')
    if (!isDevMode) return <></>
    return (
        <ListItem>
            <ListItemIcon>
                <HeartBrokenIcon />
            </ListItemIcon>
            <ListItemText
                primary="この要素の描画中に問題が発生しました"
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

export const Timeline = memo(timeline)
Timeline.displayName = 'Timeline'
