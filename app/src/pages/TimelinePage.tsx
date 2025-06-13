import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Divider } from '@mui/material'
import { useParams } from 'react-router-dom'
import { TimelineHeader } from '../components/TimelineHeader'
import { useClient } from '../context/ClientContext'
import { RealtimeTimeline } from '../components/RealtimeTimeline'
import { TimelineInfo } from '../components/TimelineInfo'
import { usePreference } from '../context/PreferenceContext'
import { type CommunityTimelineSchema, type Timeline as typeTimeline } from '@concrnt/worldlib'
import { CCDrawer } from '../components/ui/CCDrawer'
import { type VListHandle } from 'virtua'

import TagIcon from '@mui/icons-material/Tag'
import TuneIcon from '@mui/icons-material/Tune'
import InfoIcon from '@mui/icons-material/Info'
import LockIcon from '@mui/icons-material/Lock'
import { useGlobalState } from '../context/GlobalState'
import { CCPostEditor } from '../components/Editor/CCPostEditor'
import { useEditorModal } from '../components/EditorModal'
import { PrivateTimelineDoor } from '../components/PrivateTimelineDoor'
import { Helmet } from 'react-helmet-async'
import { TimelineBanner } from '../components/TimelineBanner'

export const TimelinePage = memo((): JSX.Element => {
    const { client } = useClient()
    const { allKnownTimelines } = useGlobalState()

    const { id } = useParams()

    const [showEditorOnTop] = usePreference('showEditorOnTop')
    const [showEditorOnTopMobile] = usePreference('showEditorOnTopMobile')

    const timelineRef = useRef<VListHandle>(null)

    const targetTimelineID = id ?? ''
    const [timeline, setTimeline] = useState<typeTimeline<CommunityTimelineSchema> | null>(null)

    const [timelineInfoOpen, setTimelineBannerOpen] = useState<boolean>(false)

    const isOwner = useMemo(() => {
        return timeline?.author === client.ccid
    }, [timeline])

    const timelines = useMemo(() => {
        return timeline ? [timeline] : []
    }, [timeline])

    const timelineFQIDs = useMemo(() => {
        return timeline ? [timeline.fqid] : []
    }, [timeline])

    useEffect(() => {
        client.getTimeline<CommunityTimelineSchema>(targetTimelineID, { TTL: 0 }).then((t) => {
            if (t) {
                setTimeline(t)
            }
        })
    }, [id])

    const editorModal = useEditorModal()
    useEffect(() => {
        if (!timeline) return
        const opts = {
            streamPickerInitial: [timeline]
        }
        editorModal.registerOptions(opts)
        return () => {
            editorModal.unregisterOptions(opts)
        }
    }, [timeline])

    return (
        <>
            <Helmet>
                <title>{`#${timeline?.document.body.name ?? 'Not Found'} - Concrnt`}</title>
                <meta name="description" content={timeline?.document.body.description ?? ''} />
            </Helmet>
            <Box
                sx={{
                    width: '100%',
                    minHeight: '100%',
                    backgroundColor: 'background.paper',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <TimelineHeader
                    title={timeline?.document.body.name ?? 'Not Found'}
                    titleIcon={timeline?.policy.isReadPublic() ? <TagIcon /> : <LockIcon />}
                    secondaryAction={isOwner ? <TuneIcon /> : <InfoIcon />}
                    onTitleClick={() => {
                        timelineRef.current?.scrollToIndex(0, { align: 'start' })
                    }}
                    onSecondaryActionClick={() => {
                        setTimelineBannerOpen(true)
                    }}
                />
                {timeline?.policy.isReadable(client) ? (
                    <RealtimeTimeline
                        timelineFQIDs={timelineFQIDs}
                        ref={timelineRef}
                        header={
                            (timeline.policy.isWriteable(client) && (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: {
                                                xs: showEditorOnTopMobile ? 'block' : 'none',
                                                sm: showEditorOnTop ? 'block' : 'none'
                                            }
                                        }}
                                    >
                                        <CCPostEditor
                                            minRows={3}
                                            maxRows={7}
                                            streamPickerInitial={timelines}
                                            streamPickerOptions={[...new Set([...allKnownTimelines, ...timelines])]}
                                            sx={{
                                                p: { xs: 0.5, sm: 1 }
                                            }}
                                        />
                                        <Divider sx={{ mx: { xs: 0.5, sm: 1, md: 1 } }} />
                                    </Box>
                                </Box>
                            )) ||
                            undefined
                        }
                    />
                ) : (
                    <Box>
                        {timeline && <TimelineBanner timeline={timeline} />}
                        {timeline && <PrivateTimelineDoor timeline={timeline} />}
                    </Box>
                )}
            </Box>
            <CCDrawer
                open={timelineInfoOpen}
                onClose={() => {
                    setTimelineBannerOpen(false)
                }}
            >
                <TimelineInfo
                    id={targetTimelineID}
                    writers={timeline?.policy?.getWriters()}
                    readers={timeline?.policy?.getReaders()}
                />
            </CCDrawer>
        </>
    )
})
TimelinePage.displayName = 'TimelinePage'
