import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { usePersistent } from '../hooks/usePersistent'
import { useDebouncedKVSync } from '../hooks/useDebouncedKVSync'
import { useClient } from './ClientContext'
import { type s3Config, type StreamList, type ConcurrentTheme } from '../model'
import { type DeepPartial } from '../util'
import { KV_PREFIX, LS_PREFIX } from '../appConfig'

import BubbleSound from '../resources/Bubble.wav'
import NotificationSound from '../resources/Notification.wav'

export interface Preference {
    themeName: string
    storageProvider: 'imgur' | 's3' | 'domain'
    imgurClientID: string
    s3Config: s3Config
    devMode: boolean
    showEditorOnTop: boolean
    showEditorOnTopMobile: boolean
    lists: Record<string, StreamList>
    emojiPackages: string[]
    sound: {
        post: string
        notification: string
        volume: number
    }
    customThemes: Record<string, DeepPartial<ConcurrentTheme>>
    hideDisabledSubKey: boolean
    enableConcord: boolean
    autoSwitchMediaPostType: boolean
    tutorialProgress: number
    tutorialCompleted: boolean
    baseFontSize: number
    muteWords: string[]
    muteTimelines: string[]
    stripExif: boolean
    lastSeenNotification: number
}

export const defaultPreference: Preference = {
    themeName: 'blue',
    storageProvider: 'domain',
    imgurClientID: '',
    s3Config: {
        endpoint: '',
        accessKeyId: '',
        bucketName: '',
        publicUrl: '',
        secretAccessKey: '',
        forcePathStyle: false
    },
    devMode: false,
    showEditorOnTop: true,
    showEditorOnTopMobile: false,
    lists: {},
    emojiPackages: ['https://gist.githubusercontent.com/totegamma/6e1a047f54960f6bb7b946064664d793/raw/twemoji.json'],
    sound: {
        post: BubbleSound,
        notification: NotificationSound,
        volume: 50
    },
    customThemes: {},
    hideDisabledSubKey: false,
    enableConcord: false,
    autoSwitchMediaPostType: true,
    tutorialProgress: 0,
    tutorialCompleted: false,
    baseFontSize: 16,
    muteWords: [],
    muteTimelines: [],
    stripExif: true,
    lastSeenNotification: 0
}

interface PreferenceState {
    preference: Preference
    setPreference: (preference: Preference) => void
}

const PreferenceContext = createContext<PreferenceState | undefined>(undefined)

interface PreferenceProviderProps {
    children: JSX.Element
}

export const PreferenceProvider = (props: PreferenceProviderProps): JSX.Element => {
    const { client } = useClient()
    const [pref, setPref] = usePersistent<Preference>(LS_PREFIX + 'preference', defaultPreference)
    const [initialized, setInitialized] = useState<boolean>(false)

    useEffect(() => {
        if (!client) return
        if (initialized) return
        const isNoloadSettings = localStorage.getItem(LS_PREFIX + 'noloadsettings')
        if (isNoloadSettings) {
            localStorage.removeItem(LS_PREFIX + 'noloadsettings')
            return
        }
        client.api
            .getKV(`${KV_PREFIX}.preference`)
            .then((storage: string | null | undefined) => {
                setInitialized(true)
                if (!storage) return
                const parsed = JSON.parse(storage)
                setPref({
                    ...pref,
                    ...parsed
                })
            })
            .catch((e: any) => {
                setInitialized(true)
            })
    }, [])

    useDebouncedKVSync(client, `${KV_PREFIX}.preference`, pref, initialized, { delay: 1000 })

    return (
        <PreferenceContext.Provider
            value={{
                preference: pref,
                setPreference: setPref
            }}
        >
            {props.children}
        </PreferenceContext.Provider>
    )
}

export function usePreference<K extends keyof Preference>(
    key: K,
    silent: boolean = false
): [value: Preference[K], set: (value: Preference[K]) => void] {
    const ctx = useContext(PreferenceContext)
    if (!ctx) return [defaultPreference[key], () => {}]
    const { preference, setPreference } = ctx

    const value = preference[key] ?? defaultPreference[key]

    const set = useCallback(
        (value: Preference[K]) => {
            preference[key] = value

            if (silent) {
                setPreference(preference)
            } else {
                setPreference({ ...preference })
            }
        },
        [preference, setPreference, key, silent]
    )

    return [value, set]
}
