import { type Dispatch, type SetStateAction } from 'react'
import { usePersistent } from './usePersistent'
import { LS_PREFIX } from '../appConfig'
import { type WorldMedia, type Emoji, type EmojiLite } from '../model'

export interface DraftMedia {
    key: string
    progress: number
    media: WorldMedia
}

export interface DraftState {
    draft: string
    setDraft: Dispatch<SetStateAction<string>>
    emojiDict: Record<string, EmojiLite>
    setEmojiDict: Dispatch<SetStateAction<Record<string, EmojiLite>>>
    medias: DraftMedia[]
    setMedias: Dispatch<SetStateAction<DraftMedia[]>>
    uploading: boolean
    insertEmoji: (emoji: Emoji, cursorPos: number | undefined) => void
    resetDraft: () => void
}

export function useDraftState(draftKey?: string): DraftState {
    const prefix = draftKey ? `${LS_PREFIX}${draftKey}:` : LS_PREFIX

    const [draft, setDraft] = usePersistent<string>(prefix + 'draft', '')
    const [emojiDict, setEmojiDict] = usePersistent<Record<string, EmojiLite>>(prefix + 'draftEmojis', {})
    const [medias, setMedias] = usePersistent<DraftMedia[]>(prefix + 'draftMedias', [])

    const uploading = medias.some((media) => media.media.mediaURL === '')

    const insertEmoji = (emoji: Emoji, cursorPos: number | undefined): void => {
        const pos = cursorPos ?? 0
        setDraft((prev) => prev.slice(0, pos) + `:${emoji.shortcode}:` + prev.slice(pos))
        setEmojiDict((prev) => ({ ...prev, [emoji.shortcode]: { imageURL: emoji.imageURL } }))
    }

    const resetDraft = (): void => {
        setDraft('')
        setEmojiDict({})
        setMedias([])
    }

    return {
        draft,
        setDraft,
        emojiDict,
        setEmojiDict,
        medias,
        setMedias,
        uploading,
        insertEmoji,
        resetDraft
    }
}
