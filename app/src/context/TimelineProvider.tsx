import { createContext, RefObject, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { createHtmlPortalNode, HtmlPortalNode, InPortal } from 'react-reverse-portal'
import { RealtimeTimeline } from '../components/RealtimeTimeline'
import { VListHandle } from 'virtua'

export interface TimelineContextState {
    timelinePortal: HtmlPortalNode
    setTimelines: (timelines: string[]) => void
    timelineRef: RefObject<VListHandle>
}

export const TimelineContext = createContext<TimelineContextState | undefined>(undefined)

export interface TimelineProviderProps {
    children: JSX.Element
}

export const TimelineProvider = (props: TimelineProviderProps): JSX.Element => {
    const timelinePortal = useMemo(
        () =>
            createHtmlPortalNode({
                attributes: {
                    style: 'width: 100%; height: 100%; display: flex; flex-direction: column;'
                }
            }),
        []
    )

    const [timelines, setTimelines_internal] = useState<string[]>([])

    const setTimelines = useCallback(
        (newTimelines: string[]) => {
            if (timelines.length === newTimelines.length) {
                const A = new Set(timelines)
                const B = new Set(newTimelines)
                if (A.size === B.size && [...A].every((value) => B.has(value))) {
                    return // No change in timelines
                }
            }

            setTimelines_internal(newTimelines)
        },
        [timelines]
    )

    const timelineRef = useRef<VListHandle>(null)

    return (
        <>
            <InPortal node={timelinePortal}>
                <RealtimeTimeline timelineFQIDs={timelines} ref={timelineRef} />
            </InPortal>
            <TimelineContext.Provider
                value={useMemo(() => {
                    return {
                        timelinePortal,
                        setTimelines,
                        timelineRef
                    }
                }, [timelinePortal, setTimelines, timelineRef])}
            >
                {props.children}
            </TimelineContext.Provider>
        </>
    )
}

export function useTimeline(): TimelineContextState {
    const context = useContext(TimelineContext)
    return {
        timelinePortal: context?.timelinePortal ?? createHtmlPortalNode(),
        setTimelines: context?.setTimelines ?? (() => {}),
        timelineRef: context?.timelineRef ?? useRef<VListHandle>(null)
    }
}
