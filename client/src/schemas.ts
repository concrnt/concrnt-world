export const Schemas = {
    markdownMessage: 'https://schema.concrnt.world/m/markdown.json',
    replyMessage: 'https://schema.concrnt.world/m/reply.json',
    rerouteMessage: 'https://schema.concrnt.world/m/reroute.json',
    plaintextMessage: 'https://schema.concrnt.world/m/plaintext.json',
    mediaMessage: 'https://schema.concrnt.world/m/media.json',
    gfmMessage: 'https://schema.concrnt.world/m/gfm.json',
    mfmMessage: 'https://schema.concrnt.world/m/mfm.json',

    likeAssociation: 'https://schema.concrnt.world/a/like.json',
    mentionAssociation: 'https://schema.concrnt.world/a/mention.json',
    replyAssociation: 'https://schema.concrnt.world/a/reply.json',
    rerouteAssociation: 'https://schema.concrnt.world/a/reroute.json',
    reactionAssociation: 'https://schema.concrnt.world/a/reaction.json',
    upgradeAssociation: 'https://schema.concrnt.world/a/upgrade.json',
    readAccessRequestAssociation: 'https://schema.concrnt.world/a/readaccessrequest.json',

    profile: 'https://schema.concrnt.world/p/main.json',

    communityTimeline: 'https://schema.concrnt.world/t/community.json',
    emptyTimeline: 'https://schema.concrnt.world/t/empty.json',
    subprofileTimeline: 'https://schema.concrnt.world/t/subprofile.json',

    listSubscription: 'https://schema.concrnt.world/s/list.json'
} as const

export type Schema = (typeof Schemas)[keyof typeof Schemas]
