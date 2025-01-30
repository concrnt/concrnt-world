import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useClient } from './ClientContext'
import { CCDrawer } from '../components/ui/CCDrawer'
import { type CommunityTimelineSchema, type Timeline as typeTimeline } from '@concurrent-world/client'
import { TimelineHeader } from '../components/TimelineHeader'
import { type VListHandle } from 'virtua'

import TagIcon from '@mui/icons-material/Tag'
import LockIcon from '@mui/icons-material/Lock'
import { Timeline } from '../components/Timeline'
import { StreamInfo } from '../components/StreamInfo'
import { PrivateTimelineDoor } from '../components/PrivateTimelineDoor'
import { Box } from '@mui/material'

import OpenInFullIcon from '@mui/icons-material/OpenInFull'
import { useNavigate } from 'react-router-dom'

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
        console.log('TimelineDrawerProvider', timelineID)
        if (!timelineID) return
        client.getTimeline<CommunityTimelineSchema>(timelineID).then((timeline) => {
            console.log('TimelineDrawerProvider', timeline)
            setTimeline(timeline)
        })
    }, [timelineID])

    const isRestricted = timeline?.policy === 'https://policy.concrnt.world/t/inline-read-write.json'

    const readable = isRestricted
        ? timeline?.policyParams?.isReadPublic
            ? true
            : timeline?.policyParams?.reader?.includes(client.ccid ?? '')
        : true

    const timelineRef = useRef<VListHandle>(null)

    const timelineIDs = useMemo(() => {
        return timeline ? [timeline.id] : []
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
                    titleIcon={isRestricted ? <LockIcon /> : <TagIcon />}
                    secondaryAction={<OpenInFullIcon />}
                    onTitleClick={() => {
                        timelineRef.current?.scrollToIndex(0, { align: 'start', smooth: true })
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
                    {readable ? (
                        <Timeline
                            streams={timelineIDs}
                            ref={timelineRef}
                            header={timelineID ? <StreamInfo id={timelineID} /> : <></>}
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
