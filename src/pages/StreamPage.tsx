import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Divider } from '@mui/material'
import { useParams } from 'react-router-dom'
import { TimelineHeader } from '../components/TimelineHeader'
import { useClient } from '../context/ClientContext'
import { Timeline } from '../components/Timeline/main'
import { StreamInfo } from '../components/StreamInfo'
import { usePreference } from '../context/PreferenceContext'
import { type CommunityTimelineSchema, type Timeline as typeTimeline } from '@concurrent-world/client'
import { CCDrawer } from '../components/ui/CCDrawer'
import WatchingStreamContextProvider from '../context/WatchingStreamContext'
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

export const StreamPage = memo((): JSX.Element => {
    const { client } = useClient()
    const { allKnownTimelines } = useGlobalState()

    const { id } = useParams()

    const [showEditorOnTop] = usePreference('showEditorOnTop')
    const [showEditorOnTopMobile] = usePreference('showEditorOnTopMobile')

    const timelineRef = useRef<VListHandle>(null)

    const targetStreamID = id ?? ''
    const [targetStream, setTargetStream] = useState<typeTimeline<CommunityTimelineSchema> | null>(null)

    const [streamInfoOpen, setStreamInfoOpen] = useState<boolean>(false)

    const isOwner = useMemo(() => {
        return targetStream?.author === client.ccid
    }, [targetStream])

    const isRestricted = targetStream?.policy === 'https://policy.concrnt.world/t/inline-read-write.json'

    const writeable = isRestricted
        ? targetStream?.policyParams?.isWritePublic
            ? true
            : targetStream?.policyParams?.writer?.includes(client.ccid ?? '')
        : true

    const readable = isRestricted
        ? targetStream?.policyParams?.isReadPublic
            ? true
            : targetStream?.policyParams?.reader?.includes(client.ccid ?? '')
        : true

    const streams = useMemo(() => {
        return targetStream ? [targetStream] : []
    }, [targetStream])

    const streamIDs = useMemo(() => {
        return targetStream ? [targetStream.id] : []
    }, [targetStream])

    useEffect(() => {
        client.getTimeline<CommunityTimelineSchema>(targetStreamID).then((stream) => {
            if (stream) {
                setTargetStream(stream)
            }
        })
    }, [id])

    const editorModal = useEditorModal()
    useEffect(() => {
        if (!targetStream) return
        const opts = {
            streamPickerInitial: [targetStream]
        }
        editorModal.registerOptions(opts)
        return () => {
            editorModal.unregisterOptions(opts)
        }
    }, [targetStream])

    return (
        <>
            <Helmet>
                <title>{`#${targetStream?.document.body.name ?? 'Not Found'} - Concrnt`}</title>
                <meta name="description" content={targetStream?.document.body.description ?? ''} />
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
                    title={targetStream?.document.body.name ?? 'Not Found'}
                    titleIcon={isRestricted ? <LockIcon /> : <TagIcon />}
                    secondaryAction={isOwner ? <TuneIcon /> : <InfoIcon />}
                    onTitleClick={() => {
                        timelineRef.current?.scrollToIndex(0, { align: 'start', smooth: true })
                    }}
                    onSecondaryActionClick={() => {
                        setStreamInfoOpen(true)
                    }}
                />
                {readable ? (
                    <WatchingStreamContextProvider watchingStreams={streamIDs}>
                        <Timeline
                            streams={streamIDs}
                            ref={timelineRef}
                            header={
                                (writeable && (
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
                                                streamPickerInitial={streams}
                                                streamPickerOptions={[...new Set([...allKnownTimelines, ...streams])]}
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
                    </WatchingStreamContextProvider>
                ) : (
                    <Box>
                        <StreamInfo id={targetStreamID} />
                        {targetStream && <PrivateTimelineDoor timeline={targetStream} />}
                    </Box>
                )}
            </Box>
            <CCDrawer
                open={streamInfoOpen}
                onClose={() => {
                    setStreamInfoOpen(false)
                }}
            >
                <StreamInfo
                    detailed
                    id={targetStreamID}
                    writers={targetStream?.policyParams?.writer}
                    readers={targetStream?.policyParams?.reader}
                />
            </CCDrawer>
        </>
    )
})
StreamPage.displayName = 'StreamPage'
