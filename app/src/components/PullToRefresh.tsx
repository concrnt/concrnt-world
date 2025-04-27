import { Box } from '@mui/material'
import { RefObject, useCallback, useEffect, useRef, useState } from 'react'

import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import SyncIcon from '@mui/icons-material/Sync'

const PTR_HEIGHT = 60

export interface PullToRefreshProps {
    positionRef: RefObject<number>
    isFetching: boolean
    children: JSX.Element
    onRefresh: () => Promise<void>
}

export const PullToRefresh = (props: PullToRefreshProps): JSX.Element => {
    const scrollParentRef = useRef<HTMLDivElement>(null)

    const [touchPosition, setTouchPosition] = useState<number>(0)
    const [loaderSize, setLoaderSize] = useState<number>(0)
    const [loadable, setLoadable] = useState<boolean>(false)
    const [ptrEnabled, setPtrEnabled] = useState<boolean>(false)

    const onTouchStart = useCallback((raw: Event) => {
        const e = raw as TouchEvent
        setTouchPosition(e.touches[0].clientY)
        setLoadable(props.positionRef.current === 0)
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
            if (props.isFetching) {
                setPtrEnabled(false)
                return
            }
            props.onRefresh().then(() => {
                setPtrEnabled(false)
            })
        }
    }, [ptrEnabled, setPtrEnabled, props.isFetching])

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
                    {props.isFetching ? (
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
                {props.children}
            </Box>
        </>
    )
}
