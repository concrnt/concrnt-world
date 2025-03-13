import { Box, Button, Divider, Modal, Paper } from '@mui/material'
import { CCPostEditor, type CCPostEditorProps, type EditorMode } from './Editor/CCPostEditor'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useGlobalState } from '../context/GlobalState'
import { usePreference } from '../context/PreferenceContext'
import { isFulfilled, isNonNull, type CommunityTimelineSchema, type Message, type Timeline } from '@concrnt/worldlib'
import { MessageContainer } from './Message/MessageContainer'
import { useClient } from '../context/ClientContext'

export interface EditorModalState {
    open: (opts?: OpenOptions) => void
    registerOptions: (options: Options) => void
    unregisterOptions: (options: Options) => void
}

const EditorModalContext = createContext<EditorModalState>({
    open: () => {},
    registerOptions: () => {},
    unregisterOptions: () => {}
})

export interface OpenOptions {
    draft?: string
    mode?: EditorMode
    target?: Message<any>
    streamPickerInitial?: Array<Timeline<CommunityTimelineSchema>>
}

export interface PostProps extends CCPostEditorProps {
    context?: JSX.Element
}

export interface Options {
    streamPickerInitial?: Array<Timeline<CommunityTimelineSchema>>
    defaultPostHome?: boolean
    profile?: string
}

export interface EditorModalProps {
    children: JSX.Element | JSX.Element[]
}

export const EditorModalProvider = (props: EditorModalProps): JSX.Element => {
    const { client } = useClient()
    const [viewportHeight, setViewportHeight] = useState<number>(visualViewport?.height ?? 0)
    useEffect(() => {
        function handleResize(): void {
            setViewportHeight(visualViewport?.height ?? 0)
        }
        visualViewport?.addEventListener('resize', handleResize)
        return () => visualViewport?.removeEventListener('resize', handleResize)
    }, [])

    const { allKnownTimelines, isMobileSize } = useGlobalState()
    const options = useRef<Options | null>(null)
    const registerOptions = useCallback((newOptions: Options) => {
        options.current = newOptions
    }, [])
    const unregisterOptions = useCallback(() => {
        options.current = null
    }, [])

    const modalProps = isMobileSize
        ? {
              backdrop: {
                  sx: {
                      backgroundColor: 'background.default'
                  }
              }
          }
        : {}

    const [postProps, setPostProps] = useState<PostProps | null>(null)

    const [lists] = usePreference('lists')
    const home = Object.keys(lists).length > 0 ? lists[Object.keys(lists)[0]] : null

    const [homePostTimelines, setHomePostTimelines] = useState<Array<Timeline<CommunityTimelineSchema>>>([])

    useEffect(() => {
        if (!home) return
        let isMounted = true
        const exec = async (): Promise<void> => {
            const requests = await Promise.allSettled(
                home.defaultPostStreams.map((timelineID) => {
                    return client.getTimeline<CommunityTimelineSchema>(timelineID)
                })
            )

            const fulfilled = requests.filter(isFulfilled)
            const homePostTimelines = fulfilled.map((e) => e.value).filter(isNonNull)
            if (!isMounted) return
            setHomePostTimelines(homePostTimelines)
        }
        exec()
        return () => {
            isMounted = false
        }
    }, [lists, allKnownTimelines, home])

    const open = useCallback(
        (openOpts?: OpenOptions): void => {
            const opts = options.current ?? {}
            setPostProps({
                streamPickerInitial: openOpts?.streamPickerInitial ?? opts.streamPickerInitial ?? homePostTimelines,
                streamPickerOptions: allKnownTimelines,
                defaultPostHome:
                    opts.defaultPostHome ?? (home?.defaultPostHome === undefined ? true : home.defaultPostHome),
                actionTo: openOpts?.target,
                subprofile: opts?.profile,
                mode: openOpts?.mode,
                context: openOpts?.target ? (
                    <Box width="100%" maxHeight={isMobileSize ? '3rem' : 'unset'} overflow="auto">
                        <MessageContainer simple messageID={openOpts.target.id} messageOwner={openOpts.target.author} />
                    </Box>
                ) : undefined,
                onPost: () => {
                    setPostProps(null)
                },
                value: openOpts?.draft
            })
        },
        [home, allKnownTimelines, homePostTimelines, isMobileSize]
    )

    const handleKeyPress = useCallback(
        (event: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
                return
            }
            switch (event.key) {
                case 'n':
                    setTimeout(() => {
                        open()
                    }, 3)
                    break
            }
        },
        [open]
    )

    useEffect(() => {
        document.addEventListener('keydown', handleKeyPress)

        return () => {
            document.removeEventListener('keydown', handleKeyPress)
        }
    }, [handleKeyPress])

    return (
        <EditorModalContext.Provider
            value={useMemo(() => {
                return {
                    open,
                    registerOptions,
                    unregisterOptions
                }
            }, [open, registerOptions, unregisterOptions])}
        >
            {props.children}
            <Modal
                open={postProps !== null}
                onClose={() => {
                    setPostProps(null)
                }}
                slotProps={modalProps}
            >
                <Box>
                    {postProps && (
                        <>
                            {!isMobileSize ? (
                                <Paper
                                    sx={{
                                        position: 'absolute',
                                        top: '10%',
                                        left: '50%',
                                        transform: 'translate(-50%, 0%)',
                                        width: '700px',
                                        maxWidth: '90vw'
                                    }}
                                >
                                    {postProps.context && (
                                        <Box
                                            sx={{
                                                p: 1
                                            }}
                                        >
                                            {postProps.context}
                                            <Divider />
                                        </Box>
                                    )}

                                    <CCPostEditor
                                        autoFocus
                                        minRows={3}
                                        maxRows={7}
                                        {...postProps}
                                        sx={{
                                            p: 1
                                        }}
                                    />
                                </Paper>
                            ) : (
                                <Box
                                    sx={{
                                        height: viewportHeight,
                                        maxHeight: '60vh',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        overflow: 'hidden',
                                        p: 0.5,
                                        backgroundColor: 'background.default'
                                    }}
                                >
                                    <Paper
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            overflow: 'hidden',
                                            flex: 1,
                                            p: 0.5
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <Button
                                                variant="text"
                                                onClick={() => {
                                                    setPostProps(null)
                                                }}
                                                sx={{
                                                    px: 1
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </Box>
                                        {postProps.context && (
                                            <>
                                                <Divider />
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        py: 1
                                                    }}
                                                >
                                                    {postProps.context}
                                                </Box>
                                            </>
                                        )}
                                        <Divider />
                                        <CCPostEditor mobile autoFocus {...postProps} />
                                    </Paper>
                                </Box>
                            )}
                        </>
                    )}
                </Box>
            </Modal>
        </EditorModalContext.Provider>
    )
}

export function useEditorModal(): EditorModalState {
    return useContext(EditorModalContext)
}
