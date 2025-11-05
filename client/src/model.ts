import { CCID } from '@concrnt/client'
import { ProfileSchema } from './schemas/profile'

export interface UserProfile extends ProfileSchema {
    ccid: CCID
    alias?: string
    profileOverrideID?: string
    original?: {
        username?: string
        avatar?: string
    }
}

export interface ProfileOverride {
    username?: string
    avatar?: string
    description?: string
    link?: string
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
    profileOverride?: ProfileOverride
    whisper?: CCID[]
    isPrivate?: boolean
}

export interface CreateMediaCrntOptions {
    emojis?: Record<string, { imageURL?: string; animURL?: string }>
    profileOverride?: ProfileOverride
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
