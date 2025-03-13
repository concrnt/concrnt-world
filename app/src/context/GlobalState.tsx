import { type Timeline, type CommunityTimelineSchema } from '@concrnt/worldlib'
import type { Entity, Subscription, Profile } from '@concrnt/client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useClient } from './ClientContext'
import { usePreference } from './PreferenceContext'
import { useMediaQuery, useTheme } from '@mui/material'

export interface GlobalState {
    isCanonicalUser: boolean
    isRegistered: boolean
    isDomainOffline: boolean
    isMasterSession: boolean
    isMobileSize: boolean

    allKnownTimelines: Array<Timeline<CommunityTimelineSchema>>
    allKnownSubscriptions: Array<Subscription<any>>
    listedSubscriptions: Record<string, Subscription<any>>
    allProfiles: Array<Profile<any>>
    reloadList: () => void
    getImageURL: (url?: string, params?: { maxWidth?: number; maxHeight?: number; format?: string }) => string
    setSwitchToSub: (state: boolean) => void
    switchToSubOpen: boolean
    isMessageSafeToShow: (message: string, timelineIDs: string[]) => { reason: string; value: string } | undefined
}

const GlobalStateContext = createContext<GlobalState | undefined>(undefined)

interface GlobalStateProps {
    children: JSX.Element | JSX.Element[]
}

export const GlobalStateProvider = ({ children }: GlobalStateProps): JSX.Element => {
    const { client } = useClient()
    const [lists] = usePreference('lists')
    const [muteWords] = usePreference('muteWords')
    const [muteTimelines] = usePreference('muteTimelines')

    const [isDomainOffline, setDomainIsOffline] = useState<boolean>(false)
    const [entity, setEntity] = useState<Entity | null>(null)
    const isCanonicalUser = entity ? entity.domain === client?.host : true
    const [isRegistered, setIsRegistered] = useState<boolean>(true)
    const identity = JSON.parse(localStorage.getItem('Identity') || 'null')
    const isMasterSession = identity !== null
    const theme = useTheme()
    const isMobileSize = useMediaQuery(theme.breakpoints.down('sm'))

    const [allProfiles, setAllProfiles] = useState<Array<Profile<any>>>([])
    const [allKnownTimelines, setAllKnownTimelines] = useState<Array<Timeline<CommunityTimelineSchema>>>([])
    const [allKnownSubscriptions, setAllKnownSubscriptions] = useState<Array<Subscription<any>>>([])
    const [listedSubscriptions, setListedSubscriptions] = useState<Record<string, Subscription<any>>>({})

    const [switchToSubOpen, setKeyModalOpen] = useState<boolean>(false)

    const muteRegexs: [string, RegExp][] = useMemo(
        () => muteWords.map((word) => [word, new RegExp(word, 'i')]),
        [muteWords]
    )
    const isMessageSafeToShow = useCallback(
        (message: string, timelineIDs: string[]) => {
            const wordmatch = muteRegexs.find(([_, regex]) => regex.test(message))?.[0]
            if (wordmatch) {
                return { reason: 'word', value: wordmatch }
            }

            const timelineMatch = muteTimelines.find((id) => timelineIDs.includes(id))
            if (timelineMatch) {
                return { reason: 'timeline', value: timelineMatch }
            }

            return undefined
        },
        [muteRegexs, muteTimelines]
    )

    const getImageURL = useCallback(
        (url?: string, opts?: { maxWidth?: number; maxHeight?: number; format?: string }) => {
            if (!url) return ''
            if (url.startsWith('data:')) return url
            if ('world.concrnt.hyperproxy.image' in client.domainServices) {
                return `https://${client.host}${client.domainServices['world.concrnt.hyperproxy.image'].path}/${
                    opts?.maxWidth ?? ''
                }x${opts?.maxHeight ?? ''}${opts?.format ? ',' + opts.format : ''}/${url}`
            } else {
                return url
            }
        },
        [client]
    )

    useEffect(() => {
        client.api.getOwnSubscriptions<any>().then((subs) => {
            setAllKnownSubscriptions(subs)
        })
        client.api.getProfiles({ author: client.ccid }).then((characters) => {
            const profiles = (characters ?? []).filter((c) => c.schema !== 'https://schema.concrnt.world/p/main.json')
            setAllProfiles(profiles)
        })
    }, [])

    useEffect(() => {
        let unmounted = false
        setAllKnownTimelines([])
        Promise.all(
            Object.keys(lists).map((id) =>
                client.api
                    .getSubscription(id)
                    .then((sub) => {
                        return [id, sub]
                    })
                    .catch((e) => {
                        return [id, null]
                    })
            )
        ).then((subs) => {
            if (unmounted) return
            const validsubsarr = subs.filter((e) => e[1]) as Array<[string, Subscription<any>]>
            const listedSubs = Object.fromEntries(validsubsarr)
            setListedSubscriptions(listedSubs)

            const validsubs = validsubsarr.map((e) => e[1])

            const allTimelines = validsubs.flatMap((sub) => sub.items.map((e) => e.id))
            const uniq = [...new Set(allTimelines)]
            uniq.forEach((id) => {
                client.getTimeline<CommunityTimelineSchema>(id).then((stream) => {
                    if (stream && !unmounted) {
                        setAllKnownTimelines((prev) => [...prev, stream])
                    }
                })
            })
        })

        return () => {
            unmounted = true
        }
    }, [lists])

    const reloadList = useCallback(() => {
        setAllKnownTimelines([])
        Promise.all(
            Object.keys(lists).map((id) =>
                client.api
                    .getSubscription(id)
                    .then((sub) => {
                        return [id, sub]
                    })
                    .catch((e) => {
                        return [id, null]
                    })
            )
        ).then((subs) => {
            const validsubsarr = subs.filter((e) => e[1]) as Array<[string, Subscription<any>]>
            const listedSubs = Object.fromEntries(validsubsarr)
            setListedSubscriptions(listedSubs)

            const validsubs = validsubsarr.map((e) => e[1])

            const allTimelins = validsubs.flatMap((sub) => sub.items.map((e) => e.id))
            const uniq = [...new Set(allTimelins)]
            uniq.forEach((id) => {
                client.getTimeline<CommunityTimelineSchema>(id).then((stream) => {
                    if (stream) {
                        setAllKnownTimelines((prev) => [...prev, stream])
                    }
                })
            })
        })
        client.api.getOwnSubscriptions<any>().then((subs) => {
            setAllKnownSubscriptions(subs)
        })
    }, [client, lists])

    useEffect(() => {
        client.api
            .fetchWithCredential<Entity>(client.host, '/api/v1/entity', {
                method: 'GET'
            })
            .then((data) => {
                setEntity(data.content)
            })
            .catch((e) => {
                if (e.message.includes('403')) {
                    setIsRegistered(false)
                } else {
                    setDomainIsOffline(true)
                }
            })
    }, [client])

    const setSwitchToSub = useCallback((state: boolean) => {
        setKeyModalOpen(state)
    }, [])

    return (
        <GlobalStateContext.Provider
            value={useMemo(() => {
                return {
                    isCanonicalUser,
                    isRegistered,
                    isDomainOffline,
                    isMobileSize,
                    isMasterSession,
                    allKnownTimelines,
                    allKnownSubscriptions,
                    listedSubscriptions,
                    reloadList,
                    allProfiles,
                    getImageURL,
                    setSwitchToSub,
                    switchToSubOpen,
                    isMessageSafeToShow
                }
            }, [
                isCanonicalUser,
                isRegistered,
                isDomainOffline,
                isMobileSize,
                isMasterSession,
                allKnownTimelines,
                allKnownSubscriptions,
                listedSubscriptions,
                reloadList,
                allProfiles,
                getImageURL,
                setSwitchToSub,
                switchToSubOpen,
                isMessageSafeToShow
            ])}
        >
            {children}
        </GlobalStateContext.Provider>
    )
}

export function useGlobalState(): GlobalState {
    const context = useContext(GlobalStateContext)
    if (context === undefined) {
        return {
            isCanonicalUser: false,
            isRegistered: false,
            isDomainOffline: false,
            isMasterSession: false,
            isMobileSize: false,
            allKnownTimelines: [],
            allKnownSubscriptions: [],
            listedSubscriptions: {},
            reloadList: () => {},
            allProfiles: [],
            getImageURL: (url?: string, _options?: any) => url ?? '',
            setSwitchToSub: (_state: boolean) => {},
            switchToSubOpen: false,
            isMessageSafeToShow: (_message: string) => undefined
        }
    }
    return context
}
