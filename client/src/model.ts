import { CCID } from '@concrnt/client'

export interface ProfileOverride {
    username?: string
    avatar?: string
    description?: string
    link?: string
    profileID?: string
}

export interface SubProfile {
    profileID?: string
}

export interface CreateCurrentOptions {
    emojis?: Record<string, { imageURL?: string; animURL?: string }>
    profileOverride?: ProfileOverride
    mentions?: CCID[]
    whisper?: CCID[]
    isPrivate?: boolean
}

export interface CreatePlaintextCrntOptions {
    profileOverride?: SubProfile
    whisper?: CCID[]
    isPrivate?: boolean
}

export interface CreateMediaCrntOptions {
    emojis?: Record<string, { imageURL?: string; animURL?: string }>
    profileOverride?: SubProfile
    medias?: {
        mediaURL: string
        mediaType: string
        thumbnailURL?: string
        blurhash?: string
    }[]
    whisper?: CCID[]
    isPrivate?: boolean
}

export interface BadgeRef {
    seriesId: string
    badgeId: string
}
