import { Box, Divider, ListItem, ListItemIcon, ListItemText, type SxProps, Typography, useTheme } from '@mui/material'
import React, { memo, useEffect, useState, useRef, forwardRef, type ForwardedRef } from 'react'
import { AssociationFrame } from './Association/AssociationFrame'
import { Loading } from './ui/Loading'
import { MessageContainer } from './Message/MessageContainer'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import HeartBrokenIcon from '@mui/icons-material/HeartBroken'
import { type Query, type QueryTimelineReader as CoreTimelineReader } from '@concrnt/client'
import useSound from 'use-sound'
import { usePreference } from '../context/PreferenceContext'
import { VList, type VListHandle } from 'virtua'
import { useClient } from '../context/ClientContext'
import { UseSoundFormats } from '../constants'
import { PullToRefresh } from './PullToRefresh'
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

const timeline = forwardRef((props: TimelineProps, ref: ForwardedRef<VListHandle>): JSX.Element => {
    const { client } = useClient()
    const theme = useTheme()
    const [sound] = usePreference('sound')

    const timeline = useRef<CoreTimelineReader | null>(null)

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
        setTimelineLoading(true)
        client.newTimelineQuery().then((t) => {
            if (isCancelled) return
            timeline.current = t
            timeline.current
                .init(props.timeline, props.query, props.batchSize ?? 16)
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
        }
    }, [props.timeline, props.query, client])

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

    const onRefresh = async (): Promise<void> => {
        console.log('refresh!')
        setIsFetching(true)
        setHasMoreData(false)
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
    const { t } = useTranslation()
    const [isDevMode] = usePreference('devMode')
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

export const QueryTimelineReader = memo(timeline)
QueryTimelineReader.displayName = 'QueryTimelineReader'
