import { Box, Button, Divider, Menu, Tab, Tabs, Typography } from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, Link as RouterLink, useSearchParams } from 'react-router-dom'
import { usePreference } from '../context/PreferenceContext'
import { Timeline } from '../components/Timeline'
import { useClient } from '../context/ClientContext'
import {
    type CommunityTimelineSchema,
    type Timeline as CoreTimeline,
    type CoreSubscription,
    type ListSubscriptionSchema,
    type CoreSubscriptionItem
} from '@concurrent-world/client'
import TuneIcon from '@mui/icons-material/Tune'
import ExploreIcon from '@mui/icons-material/Explore'
import { ListSettings } from '../components/ListSettings'
import ListIcon from '@mui/icons-material/List'
import { CCDrawer } from '../components/ui/CCDrawer'
import { TimelineHeader } from '../components/TimelineHeader'
import { type VListHandle } from 'virtua'
import { useGlobalState } from '../context/GlobalState'
import { ListItemTimeline } from '../components/ui/ListItemTimeline'
import { CCPostEditor } from '../components/Editor/CCPostEditor'
import { useEditorModal } from '../components/EditorModal'
import { type StreamList } from '../model'
import { Helmet } from 'react-helmet-async'
import { useGlobalActions } from '../context/GlobalActions'
import { timeline } from '@google/model-viewer/lib/utilities/animation'

export function ListPage(): JSX.Element {
    const { client } = useClient()
    const path = useLocation()
    const navigate = useNavigate()
    const editorModal = useEditorModal()
    const { allKnownTimelines, allKnownSubscriptions, reloadList } = useGlobalState()
    const { registerHomeButtonCallBack } = useGlobalActions()
    const [lists, _setLists] = usePreference('lists')
    const [showEditorOnTop] = usePreference('showEditorOnTop')
    const [showEditorOnTopMobile] = usePreference('showEditorOnTopMobile')
    const rawid = path.hash.replace('#', '')
    const id = lists[rawid] ? rawid : Object.keys(lists)[0]
    const [tab, setTab] = useState<string>(id)
    const [subscription, setSubscription] = useState<CoreSubscription<ListSubscriptionSchema> | null>(null)
    const [params] = useSearchParams()
    const title = params.get('title')?.trim()
    const text = params.get('text')?.trim()
    const url = params.get('url')?.trim()

    const [intentDraft, setIntentDraft] = useState<string | undefined>(undefined)

    const [listSettingsOpen, setListSettingsOpen] = useState<boolean>(false)

    const timelineRef = useRef<VListHandle>(null)

    const timelines = useMemo(() => subscription?.items.map((e) => e.id) ?? [], [subscription])

    const [updater, setUpdater] = useState<number>(0)

    const tabSubAnchor = useRef<HTMLDivElement | null>(null)
    const [tabSubscription, setTabSubscription] = useState<CoreSubscriptionItem[] | undefined>()

    const list: StreamList | undefined = lists[id]
    const postStreams = useMemo(() => {
        if (!list) return []
        return list.defaultPostStreams
            .map((streamID) => allKnownTimelines.find((e) => (e.cacheKey ?? e.id) === streamID))
            .filter((e) => e !== undefined) as Array<CoreTimeline<CommunityTimelineSchema>>
    }, [list, allKnownTimelines])

    const defaultPostHome = useMemo(() => {
        if (!list) return true
        return list.defaultPostHome === undefined ? true : list.defaultPostHome
    }, [list])

    // Homeボタンを押したときに一番上に行くやつ
    useEffect(() => {
        registerHomeButtonCallBack(() => {
            // タイムラインがスクロールされてたら一番上に戻す
            if (timelineRef.current?.scrollOffset !== 0) {
                timelineRef.current?.scrollToIndex(0, { align: 'start', smooth: true })
                // preventDefault用
                return true
            } else {
                // スクロールされてなかったらHomeに戻す
                return false
            }
        })

        return () => {
            registerHomeButtonCallBack(() => false)
        }
    }, [timelineRef])

    useEffect(() => {
        if (title || text || url) {
            let draft = ''
            if (title) draft += `${title}\n`
            if (text) draft += `${text}\n\n`
            if (url) draft += `${url}`
            if (draft.trim() !== '') setIntentDraft(draft)
        }
    }, [title, text, url, postStreams])

    useEffect(() => {
        if (list?.defaultPostStreams.length !== postStreams.length) return
        const opts = {
            streamPickerInitial: postStreams,
            defaultPostHome,
            profile: list?.defaultProfile
        }
        editorModal.registerOptions(opts)

        if (intentDraft && postStreams.length > 0) {
            editorModal.open({
                draft: intentDraft
            })
            setIntentDraft(undefined)
        }

        return () => {
            editorModal.unregisterOptions(opts)
        }
    }, [postStreams, defaultPostHome, list?.defaultProfile])

    const pinnedSubscriptions = useMemo(() => {
        return Object.keys(lists)
            .filter((e) => lists[e].pinned)
            .map((e) => allKnownSubscriptions.find((x) => x.id === e))
            .filter((e) => e !== undefined) as Array<CoreSubscription<ListSubscriptionSchema>>
    }, [lists, allKnownSubscriptions])

    useEffect(() => {
        if (id) setTab(id)
    }, [id])

    useEffect(() => {
        navigate(`#${tab}`)
    }, [tab])

    useEffect(() => {
        client.api.getSubscription<ListSubscriptionSchema>(id).then((sub) => {
            if (!sub) return
            setSubscription(sub)
        })
    }, [id, client, updater])

    const longtap = useRef<NodeJS.Timeout | null>(null)
    const tabPressStart = useCallback(
        (target: HTMLDivElement, subid: string) => {
            longtap.current = setTimeout(() => {
                const list = allKnownSubscriptions.find((x) => x.id === subid)
                if (list) {
                    tabSubAnchor.current = target
                    setTabSubscription(list.items)
                }
                longtap.current = null
            }, 300)
        },
        [allKnownSubscriptions]
    )

    const tabPressEnd = useCallback(
        (subid: string) => {
            if (longtap.current) {
                clearTimeout(longtap.current)
                longtap.current = null
                if (subid === tab) {
                    timelineRef.current?.scrollToIndex(0, { align: 'start', smooth: true })
                } else {
                    setTab(subid)
                }
            }
        },
        [tab]
    )

    return (
        <>
            <Helmet>
                <title>{`${subscription?.document.body.name ?? 'No Name'} - Concrnt`}</title>
                <meta name="description" content={subscription?.document.body.description ?? ''} />
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
                    title={subscription?.document.body.name ?? 'No Name'}
                    titleIcon={
                        subscription?.document.body.iconURL ? (
                            <img
                                src={subscription.document.body.iconURL}
                                alt="list icon"
                                style={{
                                    height: '1.125rem'
                                }}
                            />
                        ) : (
                            <ListIcon />
                        )
                    }
                    secondaryAction={<TuneIcon />}
                    onSecondaryActionClick={() => {
                        setListSettingsOpen(true)
                    }}
                    onTitleClick={() => {
                        timelineRef.current?.scrollToIndex(0, { align: 'start', smooth: true })
                    }}
                />
                <Tabs
                    value={tab}
                    textColor="secondary"
                    indicatorColor="secondary"
                    variant="scrollable"
                    scrollButtons={false}
                >
                    {pinnedSubscriptions.map((sub) => {
                        const useIcon = sub.document.body.iconURL && lists[sub.id].isIconTab

                        return (
                            <Tab
                                key={sub.id}
                                value={sub.id}
                                label={
                                    useIcon ? (
                                        <img
                                            src={sub.document.body.iconURL}
                                            alt="list icon"
                                            style={{
                                                height: '1.125rem'
                                            }}
                                        />
                                    ) : (
                                        sub.document.body.name
                                    )
                                }
                                onTouchStart={(a) => {
                                    tabPressStart(a.currentTarget, sub.id)
                                }}
                                onTouchEnd={() => {
                                    tabPressEnd(sub.id)
                                }}
                                onMouseDown={(a) => {
                                    tabPressStart(a.currentTarget, sub.id)
                                }}
                                onMouseUp={() => {
                                    tabPressEnd(sub.id)
                                }}
                                sx={{
                                    fontSize: '0.9rem',
                                    padding: '0',
                                    textTransform: 'none',
                                    userSelect: 'none'
                                }}
                            />
                        )
                    })}
                </Tabs>

                {subscription ? (
                    <>
                        {timelines.length > 0 ? (
                            <Timeline
                                header={
                                    <>
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
                                                subprofile={list.defaultProfile}
                                                streamPickerOptions={allKnownTimelines}
                                                streamPickerInitial={postStreams}
                                                defaultPostHome={defaultPostHome}
                                                sx={{
                                                    p: { xs: 0.5, sm: 1 }
                                                }}
                                            />
                                            <Divider sx={{ mx: { xs: 0.5, sm: 1, md: 1 } }} />
                                        </Box>
                                    </>
                                }
                                streams={timelines}
                                ref={timelineRef}
                            />
                        ) : (
                            <Box
                                sx={{
                                    marginTop: 4,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                <Box
                                    style={{
                                        display: 'flex',
                                        marginTop: 8,
                                        marginLeft: 8,
                                        marginRight: 8,
                                        flexDirection: 'column',
                                        alignItems: 'center'
                                    }}
                                >
                                    <Button component={RouterLink} to="/explorer/timelines">
                                        <Typography variant="h1" sx={{ fontWeight: 600, mx: 1 }}>
                                            Go Explore
                                        </Typography>
                                        <ExploreIcon sx={{ fontSize: '10rem', verticalAlign: 'middle' }} />
                                    </Button>
                                    <p>フォローするユーザー・コミュニティを探しに行く</p>
                                </Box>
                            </Box>
                        )}
                    </>
                ) : (
                    <></>
                )}
            </Box>
            <CCDrawer
                open={listSettingsOpen}
                onClose={() => {
                    setListSettingsOpen(false)
                }}
            >
                {listSettingsOpen && subscription ? (
                    <ListSettings
                        subscription={subscription}
                        onModified={() => {
                            setUpdater((e) => e + 1)
                            reloadList()
                        }}
                    />
                ) : (
                    <>Loading...</>
                )}
            </CCDrawer>
            <Menu
                anchorEl={tabSubAnchor.current}
                open={!!tabSubscription}
                onClose={() => {
                    setTabSubscription(undefined)
                }}
                sx={{
                    maxHeight: '80vh',
                    overflowY: 'auto'
                }}
            >
                {tabSubscription?.map((sub) => (
                    <ListItemTimeline key={sub.id} timelineID={sub.id} />
                ))}
            </Menu>
        </>
    )
}
