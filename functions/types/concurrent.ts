
export interface ApiResponse<T> {
    status: string
    content: T
}

export interface CoreEntity {
    ccid: string
    alias?: string
    tag: string
    domain: string
    cdate: string
    score: number

    affiliationDocument: string
    affiliationSignature: string

    tombstoneDocument?: string
    tombstoneSignature?: string
}

export interface CoreProfile {
    author: string
    schema: string
    id: string
    document: string
    signature: string
    cdate: string
}

export interface CoreMessage {
    id: string
    author: string
    schema: string
    document: string
    signature: string
    timelines: string[]
    policy?: string
    policyParams?: string
    cdate: string
}

export interface CoreTimeline {
    id: string
    indexable: boolean
    author: string
    owner: string
    schema: string
    policy?: string
    policyParams?: string
    document: string
    signature: string
    cdate: string
    mdate: string
}

export interface WorldProfile {
    username: string
    description: string
    avatar: string
    banner: string
    subprofiles: string
}


export interface WorldMessage {
    body: string
    emojis: {}
    mentions: []
    profileOverride?: {
        profileID?: string
    }
    medias?: {
        mediaURL: string;
        mediaType: string;
        thumbnailURL?: string;
        blurhash?: string;
        flag?: string;
    }[]
}

export interface WorldCommunityTimeline {
    name: string
    shortname: string
    description: string
    banner: string
}
