import { Box, Divider, ListItem, ListItemIcon, ListItemText, type SxProps, Typography, useTheme } from '@mui/material'
import React, { memo, useEffect, useState, useRef, forwardRef, type ForwardedRef } from 'react'
import { AssociationFrame } from './Association/AssociationFrame'
import { Loading } from './ui/Loading'
import { MessageContainer } from './Message/MessageContainer'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import HeartBrokenIcon from '@mui/icons-material/HeartBroken'
import { type TimelineReader } from '@concrnt/client'
import { useRefWithForceUpdate } from '../hooks/useRefWithForceUpdate'
import useSound from 'use-sound'
import { usePreference } from '../context/PreferenceContext'
import { VList, type VListHandle } from 'virtua'
import { useClient } from '../context/ClientContext'
import { UseSoundFormats } from '../constants'
import { useGlobalState } from '../context/GlobalState'
import { PullToRefresh } from './PullToRefresh'

export interface RealtimeTimelineProps {
    timelineFQIDs: string[]
    perspective?: string
    header?: JSX.Element
    onScroll?: (top: number) => void
    noRealtime?: boolean
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

const timeline = forwardRef((props: RealtimeTimelineProps, ref: ForwardedRef<VListHandle>): JSX.Element => {
    const { client } = useClient()
    const { isDomainOffline } = useGlobalState()
    const theme = useTheme()
    const [sound] = usePreference('sound')

    const [timeline, timelineChanged] = useRefWithForceUpdate<TimelineReader | null>(null)

    const [hasMoreData, setHasMoreData] = useState<boolean>(false)
    const [isFetching, setIsFetching] = useState<boolean>(false)

    const positionRef = useRef<number>(0)

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
        const request = async () => {
            if (props.timelineFQIDs.length === 0) return
            setTimelineLoading(true)

            let hostOverride = undefined
            if (isDomainOffline && props.timelineFQIDs.length === 1) {
                const leaderTimeline = await client.getTimeline(props.timelineFQIDs[0])
                if (leaderTimeline) {
                    hostOverride = leaderTimeline.host
                    console.warn('timeline host override:', hostOverride)
                }
            }

            return client
                .newTimelineReader({
                    withoutSocket: props.noRealtime ?? false,
                    hostOverride: hostOverride
                })
                .then((t) => {
                    if (isCancelled) return
                    timeline.current = t
                    t.onUpdate = () => {
                        timelineChanged()
                    }
                    t.onRealtimeEvent = (event) => {
                        if (event.parsedDoc?.type === 'message') {
                            playBubbleRef.current()
                        }
                    }
                    timeline.current
                        .listen(props.timelineFQIDs)
                        .then((hasMore) => {
                            setHasMoreData(hasMore)
                        })
                        .finally(() => {
                            setTimelineLoading(false)
                        })
                    return t
                })
        }
        const mt = request()
        return () => {
            isCancelled = true
            mt.then((t) => {
                t?.dispose()
            })
        }
    }, [props.timelineFQIDs, isDomainOffline])

    const count = timeline.current?.body.length ?? 0
    let alreadyFetchInThisRender = false

    const onRefresh = async (): Promise<void> => {
        console.log('refresh!')
        setIsFetching(true)
        setHasMoreData(false)
        const hasMore = (await timeline.current?.reload()) ?? false
        setHasMoreData(hasMore)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setIsFetching(false)
    }

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
                    : (timelineLoading ? [] : (timeline.current?.body ?? [])).map((e) => {
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
                                          timestamp={e.lastUpdate}
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
        </PullToRefresh>
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

export const RealtimeTimeline = memo(timeline)
RealtimeTimeline.displayName = 'Timeline'
