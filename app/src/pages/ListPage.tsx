import { Box, Button, Divider, Menu, Tab, Tabs, Typography } from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, Link as RouterLink, useSearchParams } from 'react-router-dom'
import { usePreference } from '../context/PreferenceContext'
import { useClient } from '../context/ClientContext'
import {
    isFulfilled,
    isNonNull,
    type CommunityTimelineSchema,
    type ListSubscriptionSchema,
    type Timeline as TypeTimeline
} from '@concrnt/worldlib'
import { type Subscription as CoreSubscription, type SubscriptionItem as CoreSubscriptionItem } from '@concrnt/client'
import TuneIcon from '@mui/icons-material/Tune'
import ExploreIcon from '@mui/icons-material/Explore'
import { ListSettings } from '../components/ListSettings'
import ListIcon from '@mui/icons-material/List'
import { CCDrawer } from '../components/ui/CCDrawer'
import { TimelineHeader } from '../components/TimelineHeader'
import { useGlobalState } from '../context/GlobalState'
import { ListItemTimeline } from '../components/ui/ListItemTimeline'
import { CCPostEditor } from '../components/Editor/CCPostEditor'
import { useEditorModal } from '../components/EditorModal'
import { type StreamList } from '../model'
import { Helmet } from 'react-helmet-async'
import { useGlobalActions } from '../context/GlobalActions'
import { useTranslation } from 'react-i18next'
import { useTimeline } from '../context/TimelineProvider'
import { OutPortal } from 'react-reverse-portal'

export function ListPage(): JSX.Element {
    const { client } = useClient()
    const { t } = useTranslation('', { keyPrefix: 'pages.list' })
    const path = useLocation()
    const navigate = useNavigate()
    const editorModal = useEditorModal()
    const { allKnownTimelines, allKnownSubscriptions, reloadList } = useGlobalState()
    const { registerHomeButtonCallBack } = useGlobalActions()
    const [lists, _setLists] = usePreference('lists')
    const [showEditorOnTop] = usePreference('showEditorOnTop')
    const [showEditorOnTopMobile] = usePreference('showEditorOnTopMobile')

    const { timelinePortal, setTimelines, timelineRef } = useTimeline()

    const tab = path.hash.replace('#', '')
    const id = lists[tab] ? tab : Object.keys(lists)[0]

    const [subscription, setSubscription] = useState<CoreSubscription<ListSubscriptionSchema> | null>(null)
    const [params] = useSearchParams()
    const title = params.get('title')?.trim()
    const text = params.get('text')?.trim()
    const url = params.get('url')?.trim()

    const [intentDraft, setIntentDraft] = useState<string | undefined>(undefined)

    const [listSettingsOpen, setListSettingsOpen] = useState<boolean>(false)

    const timelines = useMemo(() => subscription?.items.map((e) => e.id) ?? [], [subscription])
    useEffect(() => {
        if (!subscription) return
        setTimelines(subscription.items.map((e) => e.id))
    }, [setTimelines, subscription])

    const [updater, setUpdater] = useState<number>(0)

    const tabSubAnchor = useRef<HTMLDivElement | null>(null)
    const [tabSubscription, setTabSubscription] = useState<CoreSubscriptionItem[] | undefined>()

    const list: StreamList | undefined = lists[id]
    const [postTimelines, setPostTimelines] = useState<Array<TypeTimeline<CommunityTimelineSchema>>>([])

    useEffect(() => {
        let unmounted = false
        if (!list) return
        Promise.allSettled(
            list.defaultPostStreams.map((streamID) => {
                return client.getTimeline<CommunityTimelineSchema>(streamID)
            })
        ).then((results) => {
            const fulfilled = results.filter(isFulfilled)
            const nonNullValues = fulfilled.map((e) => e.value).filter(isNonNull)
            if (unmounted) return
            setPostTimelines(nonNullValues)
        })

        return () => {
            unmounted = true
        }
    }, [list, client])

    const defaultPostHome = useMemo(() => {
        if (!list) return true
        return list.defaultPostHome === undefined ? true : list.defaultPostHome
    }, [list])

    // Homeボタンを押したときに一番上に行くやつ
    useEffect(() => {
        registerHomeButtonCallBack(() => {
            // タイムラインがスクロールされてたら一番上に戻す
            if (timelineRef.current?.scrollOffset !== 0) {
                timelineRef.current?.scrollToIndex(0, { align: 'start' })
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
    }, [title, text, url, postTimelines])

    useEffect(() => {
        if (list?.defaultPostStreams.length !== postTimelines.length) return
        const opts = {
            streamPickerInitial: postTimelines,
            defaultPostHome,
            profile: list?.defaultProfile
        }
        editorModal.registerOptions(opts)

        if (intentDraft && postTimelines.length > 0) {
            editorModal.open({
                draft: intentDraft
            })
            setIntentDraft(undefined)
        }

        return () => {
            editorModal.unregisterOptions(opts)
        }
    }, [postTimelines, defaultPostHome, list?.defaultProfile])

    useEffect(() => {
        client.api.getSubscription<ListSubscriptionSchema>(id).then((sub) => {
            setSubscription(sub)
        })
    }, [id, client, updater])

    const pinnedSubscriptions = useMemo(() => {
        return Object.keys(lists)
            .filter((e) => lists[e].pinned)
            .map((e) => allKnownSubscriptions.find((x) => x.id === e))
            .filter((e) => e !== undefined) as Array<CoreSubscription<ListSubscriptionSchema>>
    }, [lists, allKnownSubscriptions])

    const touchedTabPos = useRef<number>(0)
    const longtap = useRef<NodeJS.Timeout | null>(null)
    const tabPressStart = useCallback(
        (target: HTMLDivElement, subid: string) => {
            touchedTabPos.current = target.getBoundingClientRect().left
            longtap.current = setTimeout(() => {
                if (target.getBoundingClientRect().left !== touchedTabPos.current) return
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
        (target: HTMLDivElement, subid: string) => {
            if (touchedTabPos.current !== target.getBoundingClientRect().left) {
                // cancel
                if (longtap.current) {
                    clearTimeout(longtap.current)
                    longtap.current = null
                }
                return
            }
            if (longtap.current) {
                clearTimeout(longtap.current)
                longtap.current = null
                if (subid === tab) {
                    timelineRef.current?.scrollToIndex(0, { align: 'start' })
                } else {
                    navigate(`#${subid}`)
                }
            }
        },
        [tab]
    )

    return (
        <>
            <Helmet>
                <title>{`${subscription?.parsedDoc.body.name ?? 'No Name'} - Concrnt`}</title>
                <meta name="description" content={subscription?.parsedDoc.body.description ?? ''} />
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
                    title={subscription?.parsedDoc.body.name ?? 'No Name'}
                    titleIcon={
                        subscription?.parsedDoc.body.iconURL ? (
                            <img
                                src={subscription.parsedDoc.body.iconURL}
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
                        timelineRef.current?.scrollToIndex(0, { align: 'start' })
                    }}
                />
                <Tabs
                    value={id}
                    textColor="secondary"
                    indicatorColor="secondary"
                    variant="scrollable"
                    scrollButtons={false}
                >
                    {pinnedSubscriptions.map((sub) => {
                        const useIcon = sub.parsedDoc.body.iconURL && lists[sub.id].isIconTab

                        return (
                            <Tab
                                key={sub.id}
                                value={sub.id}
                                label={
                                    useIcon ? (
                                        <img
                                            src={sub.parsedDoc.body.iconURL}
                                            alt="list icon"
                                            style={{
                                                height: '1.125rem'
                                            }}
                                        />
                                    ) : (
                                        sub.parsedDoc.body.name
                                    )
                                }
                                onTouchStart={(a) => {
                                    tabPressStart(a.currentTarget, sub.id)
                                }}
                                onTouchEnd={(a) => {
                                    tabPressEnd(a.currentTarget, sub.id)
                                }}
                                onMouseDown={(a) => {
                                    tabPressStart(a.currentTarget, sub.id)
                                }}
                                onMouseUp={(a) => {
                                    tabPressEnd(a.currentTarget, sub.id)
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
                            <>
                                <OutPortal
                                    node={timelinePortal}
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
                                                    streamPickerInitial={postTimelines}
                                                    defaultPostHome={defaultPostHome}
                                                    sx={{
                                                        p: { xs: 0.5, sm: 1 }
                                                    }}
                                                />
                                                <Divider sx={{ mx: { xs: 0.5, sm: 1, md: 1 } }} />
                                            </Box>
                                        </>
                                    }
                                />
                            </>
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
                                    <p>{t('goExplore')}</p>
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
                {tabSubscription?.map((sub) => <ListItemTimeline key={sub.id} timelineID={sub.id} />)}
            </Menu>
        </>
    )
}
