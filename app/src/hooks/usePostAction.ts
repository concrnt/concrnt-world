import { useCallback, useRef, useState } from 'react'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { type CommunityTimelineSchema, type Timeline, type Message, type User, type ProfileSchema, type Client } from '@concrnt/worldlib'
import { type EmojiLite } from '../model'
import { type DraftMedia } from './useDraftState'
import { type EditorMode } from '../components/Editor/CCPostEditor'
import { Profile } from '@concrnt/client'

export interface UsePostActionParams {
    client: Client
    mode: EditorMode
    draft: string
    emojiDict: Record<string, EmojiLite>
    medias: DraftMedia[]
    destTimelines: Array<Timeline<CommunityTimelineSchema>>
    selectedSubprofile?: Profile<ProfileSchema>
    participants: User[]
    actionTo?: Message<any>
    isPrivate: boolean
    onSuccess: () => void
}

export interface PostAction {
    post: (postHome: boolean) => void
    sending: boolean
}

export function usePostAction(params: UsePostActionParams): PostAction {
    const { enqueueSnackbar } = useSnackbar()
    const { t } = useTranslation('', { keyPrefix: 'ui.draft' })
    const [sending, setSending] = useState(false)
    const paramsRef = useRef(params)
    paramsRef.current = params

    const post = useCallback(
        (postHome: boolean): void => {
            const {
                client,
                mode,
                draft,
                emojiDict,
                medias,
                destTimelines,
                selectedSubprofile,
                participants,
                actionTo,
                isPrivate,
                onSuccess
            } = paramsRef.current

            if (!client?.user) return
            if ((draft.length === 0 || draft.trim().length === 0) && !(mode === 'media' || mode === 'reroute')) {
                enqueueSnackbar(t('plzAddMessage'), { variant: 'error' })
                return
            }
            if (mode === 'media' && medias.length === 0) {
                enqueueSnackbar(t('plzAttachMedia'), { variant: 'error' })
                return
            }
            if (destTimelines.length === 0 && !postHome) {
                enqueueSnackbar(t('plzAddDestination'), { variant: 'error' })
                return
            }

            const destTimelineIDs = destTimelines.map((tl) => tl.fqid).filter((e) => e)

            const homeTimeline = selectedSubprofile
                ? 'world.concrnt.t-subhome.' + selectedSubprofile.id + '@' + client.user.ccid
                : client.user.homeTimeline
            const dest = [...new Set([...destTimelineIDs, ...(postHome ? [homeTimeline] : [])])].filter((e) => e)

            const mentionsMatches = draft.matchAll(/(^|\s+)@(con1\w{38})/g)
            const mentions = [...new Set(Array.from(mentionsMatches).map((m) => m[2]))]

            setSending(true)

            const whisper = participants.map((p) => p.ccid)
            const emojis = Object.keys(emojiDict).length > 0 ? emojiDict : undefined
            const profileOverride = selectedSubprofile ? { profileID: selectedSubprofile.id } : undefined

            let req
            switch (mode) {
                case 'plaintext':
                    req = client.createPlainTextCrnt(draft, dest, {
                        profileOverride,
                        whisper,
                        isPrivate
                    })
                    break
                case 'markdown':
                    req = client.createMarkdownCrnt(draft, dest, {
                        emojis,
                        mentions,
                        profileOverride,
                        whisper,
                        isPrivate
                    })
                    break
                case 'media':
                    req = client.createMediaCrnt(draft, dest, {
                        emojis,
                        medias: medias.map((media) => media.media),
                        profileOverride,
                        whisper,
                        isPrivate
                    })
                    break
                case 'reply':
                    if (!actionTo) {
                        req = Promise.reject(new Error('No actionTo'))
                        break
                    }
                    req = actionTo.reply(dest, draft, {
                        emojis,
                        profileOverride,
                        whisper,
                        isPrivate
                    })
                    break
                case 'reroute':
                    if (!actionTo) {
                        req = Promise.reject(new Error('No actionTo'))
                        break
                    }
                    req = actionTo.reroute(dest, '', {
                        emojis,
                        profileOverride,
                        whisper,
                        isPrivate
                    })
                    break
                default:
                    enqueueSnackbar('Invalid mode', { variant: 'error' })
            }

            req?.then(() => {
                onSuccess()
            })
                .catch((error: Error) => {
                    enqueueSnackbar(`Failed to post message: ${error.message}`, { variant: 'error' })
                })
                .finally(() => {
                    setSending(false)
                })
        },
        [enqueueSnackbar, t]
    )

    return { post, sending }
}
