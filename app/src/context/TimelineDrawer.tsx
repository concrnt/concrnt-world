import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useClient } from './ClientContext'
import { CCDrawer } from '../components/ui/CCDrawer'
import { type CommunityTimelineSchema, type Timeline as typeTimeline } from '@concrnt/worldlib'
import { TimelineHeader } from '../components/TimelineHeader'
import { type VListHandle } from 'virtua'

import TagIcon from '@mui/icons-material/Tag'
import LockIcon from '@mui/icons-material/Lock'
import { RealtimeTimeline } from '../components/RealtimeTimeline'
import { PrivateTimelineDoor } from '../components/PrivateTimelineDoor'
import { Box } from '@mui/material'

import OpenInFullIcon from '@mui/icons-material/OpenInFull'
import { useNavigate } from 'react-router-dom'
import { TimelineBanner } from '../components/TimelineBanner'

export interface TimelineDrawerState {
    open: (id: string) => void
}

const TimelineDrawerContext = createContext<TimelineDrawerState>({
    open: () => {}
})

interface TimelineDrawerProps {
    children: JSX.Element | JSX.Element[]
}

export const TimelineDrawerProvider = (props: TimelineDrawerProps): JSX.Element => {
    const { client } = useClient()

    const [timelineID, setTimelineID] = useState<string | null>(null)
    const [timeline, setTimeline] = useState<typeTimeline<CommunityTimelineSchema> | null>(null)

    const navigate = useNavigate()

    useEffect(() => {
        if (!timelineID) return
        client.getTimeline<CommunityTimelineSchema>(timelineID).then((timeline) => {
            setTimeline(timeline)
        })
    }, [timelineID])

    const timelineRef = useRef<VListHandle>(null)

    const timelineIDs = useMemo(() => {
        return timeline ? [timeline.fqid] : []
    }, [timeline])

    const open = useCallback((id: string) => {
        setTimelineID(id)
    }, [])

    return (
        <TimelineDrawerContext.Provider
            value={useMemo(() => {
                return {
                    open
                }
            }, [])}
        >
            {props.children}
            <CCDrawer
                open={!!timelineID}
                onClose={() => {
                    setTimelineID(null)
                }}
            >
                <TimelineHeader
                    title={timeline?.document.body.name ?? 'Not Found'}
                    titleIcon={timeline?.policy.isReadPublic() ? <TagIcon /> : <LockIcon />}
                    secondaryAction={<OpenInFullIcon />}
                    onTitleClick={() => {
                        timelineRef.current?.scrollToIndex(0, { align: 'start' })
                    }}
                    onSecondaryActionClick={() => {
                        setTimelineID(null)
                        navigate(`/timeline/${timelineID}`)
                    }}
                />
                <Box
                    sx={{
                        width: '100%',
                        minHeight: '100%',
                        backgroundColor: 'background.paper',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {timeline?.policy.isReadable(client) ? (
                        <RealtimeTimeline
                            timelineFQIDs={timelineIDs}
                            ref={timelineRef}
                            header={timeline ? <TimelineBanner timeline={timeline} /> : <></>}
                        />
                    ) : (
                        <Box>{timeline && <PrivateTimelineDoor timeline={timeline} />}</Box>
                    )}
                </Box>
            </CCDrawer>
        </TimelineDrawerContext.Provider>
    )
}

export function useTimelineDrawer(): TimelineDrawerState {
    return useContext(TimelineDrawerContext)
}
