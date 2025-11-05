import { Box, Fade, Paper, Popper } from '@mui/material'
import { UserProfileCard, UserProfileCardProps } from '../components/UserProfileCard'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

export interface ProfileState {
    activate: (anchorEl: HTMLElement, props: UserProfileCardProps) => void
    forceClose: () => void
}

const ProfileContext = createContext<ProfileState>({
    activate: () => {},
    forceClose: () => {}
})

interface ProfileProps {
    children: JSX.Element | JSX.Element[]
}

export const ProfileProvider = (props: ProfileProps) => {
    const [state, setState] = useState<{ anchorEl: HTMLElement | undefined; props: UserProfileCardProps | null }>({
        anchorEl: undefined,
        props: null
    })

    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const popperRef = useRef<HTMLDivElement | null>(null)

    const cursorPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
    // track cursor position
    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            cursorPos.current = { x: e.clientX, y: e.clientY }
        }
        window.addEventListener('mousemove', onMouseMove)
        return () => {
            window.removeEventListener('mousemove', onMouseMove)
        }
    }, [])

    const activate = useCallback((anchorEl: HTMLElement, props: UserProfileCardProps) => {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
            // check cursor is still over anchorEl
            const anchorRect = anchorEl.getBoundingClientRect()
            const { x, y } = cursorPos.current
            const overAnchor =
                x >= anchorRect.left && x <= anchorRect.right && y >= anchorRect.top && y <= anchorRect.bottom
            if (!overAnchor) return

            setState({ anchorEl, props })

            const update = () => {
                requestAnimationFrame(() => {
                    // force close if anchorEl is removed from DOM
                    if (!anchorEl.isConnected) {
                        setState({ anchorEl: undefined, props: props })
                        return
                    }

                    // check cursor is still over anchorEl or popperRef
                    const anchorRect = anchorEl.getBoundingClientRect()
                    const popperRect = popperRef.current?.getBoundingClientRect()
                    const { x, y } = cursorPos.current
                    const overAnchor =
                        x >= anchorRect.left && x <= anchorRect.right && y >= anchorRect.top && y <= anchorRect.bottom
                    const overPopper = popperRect
                        ? x >= popperRect.left && x <= popperRect.right && y >= popperRect.top && y <= popperRect.bottom
                        : false
                    // if not over either, close
                    if (!overAnchor && !overPopper) {
                        setState({ anchorEl: undefined, props: props })
                        return
                    }

                    // continue updating if still active
                    update()
                })
            }

            update()
        }, 300)
    }, [])

    const forceClose = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current)
        setState({ anchorEl: undefined, props: null })
    }, [])

    return (
        <ProfileContext.Provider value={useMemo(() => ({ activate, forceClose }), [])}>
            <Popper transition ref={popperRef} placement="top" open={!!state.anchorEl} anchorEl={state.anchorEl}>
                {({ TransitionProps }) => (
                    <Fade
                        {...TransitionProps}
                        timeout={{
                            enter: 200,
                            exit: 100
                        }}
                    >
                        <Paper
                            sx={{
                                m: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                minWidth: '300px',
                                maxWidth: '400px',
                                pointerEvents: 'auto'
                            }}
                            elevation={4}
                            onPointerMove={() => {}}
                        >
                            <UserProfileCard {...state.props} />
                        </Paper>
                    </Fade>
                )}
            </Popper>
            {props.children}
        </ProfileContext.Provider>
    )
}

export const useProfile = (): ProfileState => {
    return useContext(ProfileContext)
}

export interface ProfileTooltipProps extends UserProfileCardProps {
    children?: JSX.Element | Array<JSX.Element | undefined>
}

export const ProfileTooltip = (props: ProfileTooltipProps) => {
    const profile = useProfile()

    return (
        <Box
            onPointerOver={(e) => {
                profile.activate(e.currentTarget, props)
            }}
        >
            {props.children}
        </Box>
    )
}
