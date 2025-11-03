import {
    Api,
    type CCID,
    type CSID,
    type AssociationID,
    type CCDocument,
    type FQDN,
    type KeyPair,
    LoadKey,
    LoadSubKey,
    type MessageID,
    type TimelineID,
    type Entity as CoreEntity,
    type Domain as CoreDomain,
    type Timeline as CoreTimeline,
    type Profile as CoreProfile,
    Association as CoreAssociation,
    type Message as CoreMessage,
    fetchWithTimeout,
    MasterKeyAuthProvider,
    IndexedDBKVS,
    SubKeyAuthProvider,
    Socket,
    SocketListener,
    InMemoryKVS,
    GuestAuthProvider,
    TimelineReader,
    QueryTimelineReader,
    IsCSID,
    FetchOptions,
    KVS
} from '@concrnt/client'

import { Schemas, type Schema } from './schemas'
import {
    type MarkdownMessageSchema,
    type ReplyMessageSchema,
    type RerouteMessageSchema,
    type LikeAssociationSchema,
    type ReactionAssociationSchema,
    type ReplyAssociationSchema,
    type RerouteAssociationSchema,
    type ProfileSchema,
    type CommunityTimelineSchema,
    type PlaintextMessageSchema,
    type MediaMessageSchema,
    type UpgradeAssociationSchema
} from './schemas/'
import {
    UserProfile,
    type BadgeRef,
    type CreateCurrentOptions,
    type CreateMediaCrntOptions,
    type CreatePlaintextCrntOptions
} from './model'
import { isFulfilled, isNonNull } from './util'
import { loadPolicy, Policy } from './policy'

const cacheLifetime = 5 * 60 * 1000

interface Service {
    path: string
}

interface ClientOptions {
    appName?: string
    progressCallback?: (status: string) => void
    skipInit?: boolean
}

interface Cache<T> {
    data: T
    expire: number
}

export class Client {
    api: Api
    ccid?: CCID
    ckid?: string
    server?: CoreDomain
    keyPair?: KeyPair

    sockets: Record<string, Socket> = {}
    domainServices: Record<string, Service> = {}
    ackings: User[] = []
    ackers: User[] = []

    user: User | null = null
    isOnline: boolean = true

    get host(): string {
        if (!this.user) throw new Error('user is not found')
        return this.user.domain
    }

    constructor(api: Api) {
        this.api = api
        try {
            this.ccid = api.authProvider.getCCID()
            this.ckid = api.authProvider.getCKID()
        } catch (_) {}
        this.api.onMessageInvalidate = (id) => {
            delete this.messageCache[id]
        }
    }

    messageCache: Record<string, Cache<Promise<Message<any> | null>>> = {}

    static async create(privatekey: string, host: FQDN, opts?: ClientOptions): Promise<Client> {
        const keyPair = LoadKey(privatekey)
        if (!keyPair) throw new Error('invalid private key')

        opts?.progressCallback?.('initializing auth provider')
        const authProvider = new MasterKeyAuthProvider(privatekey, host)

        opts?.progressCallback?.('initializing cache engine')
        let cacheEngine: KVS | undefined = undefined
        try {
            cacheEngine = new IndexedDBKVS('concrnt-client', 'kvs')
        } catch (e) {
            console.info('indexeddb is not available. fallback to in-memory cache')
        }
        if (!cacheEngine) {
            cacheEngine = new InMemoryKVS()
        }

        opts?.progressCallback?.('creating api client')
        const api = new Api(authProvider, cacheEngine)

        const c = new Client(api)
        if (!c.ccid) throw new Error('invalid ccid')
        c.keyPair = keyPair

        if (!opts?.skipInit) {
            const cachedUserKey = `client-userkey-${c.ccid}`
            const cachedUser = await cacheEngine.get<string>(cachedUserKey)
            if (cachedUser) {
                console.log('cached user found')
                opts?.progressCallback?.('loading user from cache')

                const recovered = JSON.parse(cachedUser.data)
                recovered.client = c
                Object.setPrototypeOf(recovered, User.prototype)
                c.user = recovered

                c.getUser(c.ccid).then((freshUser) => {
                    if (freshUser) {
                        c.user = freshUser
                        cacheEngine?.set(cachedUserKey, JSON.stringify(freshUser))
                    }
                })
            } else {
                console.log('no cached user found, fetching...')
                opts?.progressCallback?.('loading user from network')
                c.user = await c.getUser(c.ccid).then((freshUser) => {
                    if (freshUser) cacheEngine?.set(cachedUserKey, JSON.stringify(freshUser))
                    return freshUser
                })
            }

            const cachedAckingsKey = `client-ackings-${c.ccid}`
            const cachedAckings = await cacheEngine.get<string>(cachedAckingsKey)
            if (cachedAckings) {
                console.log('cached ackings found')
                opts?.progressCallback?.('loading ackings from cache')
                const recovered = JSON.parse(cachedAckings.data)
                recovered.forEach((e: any) => {
                    e.client = c
                    Object.setPrototypeOf(e, User.prototype)
                })
                c.ackings = recovered
                c.user?.getAcking().then((freshAckings) => {
                    c.ackings = freshAckings
                    cacheEngine?.set(cachedAckingsKey, JSON.stringify(freshAckings))
                })
            } else {
                console.log('no cached ackings found, fetching...')
                opts?.progressCallback?.('loading ackings from network')
                c.ackings = (await c.user?.getAcking()) ?? []
                cacheEngine.set(cachedAckingsKey, JSON.stringify(c.ackings))
            }

            const cachedAckersKey = `client-ackers-${c.ccid}`
            const cachedAckers = await cacheEngine.get<string>(cachedAckersKey)
            if (cachedAckers) {
                console.log('cached ackers found')
                opts?.progressCallback?.('loading ackers from cache')
                const recovered = JSON.parse(cachedAckers.data)
                recovered.forEach((e: any) => {
                    e.client = c
                    Object.setPrototypeOf(e, User.prototype)
                })
                c.ackers = recovered
                c.user?.getAcker().then((freshAckers) => {
                    c.ackers = freshAckers
                    cacheEngine?.set(cachedAckersKey, JSON.stringify(freshAckers))
                })
            } else {
                console.log('no cached ackers found, fetching...')
                opts?.progressCallback?.('loading ackers from network')
                c.ackers = (await c.user?.getAcker()) ?? []
                cacheEngine.set(cachedAckersKey, JSON.stringify(c.ackers))
            }

            const cachedDomainServicesKey = `client-domain-services-${host}`
            const cachedDomainServices = await cacheEngine.get<Record<string, Service>>(cachedDomainServicesKey)
            if (cachedDomainServices) {
                console.log('cached domain services found')
                opts?.progressCallback?.('loading domain services from cache')
                c.domainServices = cachedDomainServices.data
                fetchWithTimeout(`https://${host}/services`, {})
                    .then((res) => res.json())
                    .then((freshServices) => {
                        if (isNonNull(freshServices)) {
                            c.domainServices = freshServices
                            cacheEngine?.set(cachedDomainServicesKey, freshServices)
                        }
                    })
                    .catch((e) => {
                        console.error('CLIENT::create::fetch::error', e)
                    })
            } else {
                console.log('no cached domain services found, fetching...')
                opts?.progressCallback?.('loading domain services from network')
                c.domainServices = await fetchWithTimeout(`https://${host}/services`, {})
                    .then((res) => res.json())
                    .catch((e) => {
                        console.error('CLIENT::create::fetch::error', e)
                        return {}
                    })
                cacheEngine.set(cachedDomainServicesKey, c.domainServices)
            }

            const domainKey = `client-domain-${host}`
            const cachedDomain = await cacheEngine.get<CoreDomain>(domainKey)
            if (cachedDomain) {
                console.log('cached domain found')
                opts?.progressCallback?.('loading domain from cache')
                c.server = cachedDomain.data
                api.getDomain(host, { cache: 'no-cache', timeoutms: 3000 })
                    .then((freshDomain) => {
                        if (isNonNull(freshDomain)) {
                            c.server = freshDomain
                            cacheEngine?.set(domainKey, freshDomain)
                        }
                    })
                    .catch((e) => {
                        console.error('CLIENT::create::getDomain::error', e)
                    })
            } else {
                console.log('no cached domain found, fetching...')
                opts?.progressCallback?.('loading domain from network')
                c.server =
                    (await c.api.getDomain(host, { cache: 'no-cache', timeoutms: 3000 }).catch((e) => {
                        console.error('CLIENT::create::getDomain::error', e)
                        return null
                    })) ?? undefined
                if (c.server) {
                    cacheEngine.set(domainKey, c.server)
                }
            }

            if (c.server) {
                c.isOnline = true
                opts?.progressCallback?.('validating profile')
                if (c.user && !(await c.checkProfileIsOk())) {
                    console.warn('profile is not ok! fixing...')
                    await c.setProfile({})
                }
            } else {
                c.isOnline = false
            }
        }

        opts?.progressCallback?.('done')
        return c
    }

    static async createFromSubkey(subkey: string, opts?: ClientOptions): Promise<Client> {
        const key = LoadSubKey(subkey)
        if (!key) throw new Error('invalid subkey')

        opts?.progressCallback?.('initializing auth provider')
        const authProvider = new SubKeyAuthProvider(subkey)

        opts?.progressCallback?.('initializing cache engine')
        let cacheEngine: KVS | undefined = undefined
        try {
            cacheEngine = new IndexedDBKVS('concrnt-client', 'kvs')
        } catch (e) {
            console.info('indexeddb is not available. fallback to in-memory cache')
        }
        if (!cacheEngine) {
            cacheEngine = new InMemoryKVS()
        }

        opts?.progressCallback?.('creating api client')
        const api = new Api(authProvider, cacheEngine)
        const host = api.authProvider.getHost()

        opts?.progressCallback?.('creating client')
        const c = new Client(api)
        if (!c.ccid) throw new Error('invalid ccid')

        if (!opts?.skipInit) {
            const cachedUserKey = `client-userkey-${c.ccid}`
            const cachedUser = await cacheEngine.get<string>(cachedUserKey)
            if (cachedUser) {
                console.log('cached user found')
                opts?.progressCallback?.('loading user from cache')

                const recovered = JSON.parse(cachedUser.data)
                recovered.client = c
                Object.setPrototypeOf(recovered, User.prototype)
                c.user = recovered

                c.getUser(c.ccid).then((freshUser) => {
                    if (freshUser) {
                        c.user = freshUser
                        cacheEngine?.set(cachedUserKey, JSON.stringify(freshUser))
                    }
                })
            } else {
                console.log('no cached user found, fetching...')
                opts?.progressCallback?.('loading user from network')
                c.user = await c.getUser(c.ccid).then((freshUser) => {
                    if (freshUser) cacheEngine?.set(cachedUserKey, JSON.stringify(freshUser))
                    return freshUser
                })
            }

            const cachedAckingsKey = `client-ackings-${c.ccid}`
            const cachedAckings = await cacheEngine.get<string>(cachedAckingsKey)
            if (cachedAckings) {
                console.log('cached ackings found')
                opts?.progressCallback?.('loading ackings from cache')
                const recovered = JSON.parse(cachedAckings.data)
                recovered.forEach((e: any) => {
                    e.client = c
                    Object.setPrototypeOf(e, User.prototype)
                })
                c.ackings = recovered
                c.user?.getAcking().then((freshAckings) => {
                    c.ackings = freshAckings
                    cacheEngine?.set(cachedAckingsKey, JSON.stringify(freshAckings))
                })
            } else {
                console.log('no cached ackings found, fetching...')
                opts?.progressCallback?.('loading ackings from network')
                c.ackings = (await c.user?.getAcking()) ?? []
                cacheEngine.set(cachedAckingsKey, JSON.stringify(c.ackings))
            }

            const cachedAckersKey = `client-ackers-${c.ccid}`
            const cachedAckers = await cacheEngine.get<string>(cachedAckersKey)
            if (cachedAckers) {
                console.log('cached ackers found')
                opts?.progressCallback?.('loading ackers from cache')
                const recovered = JSON.parse(cachedAckers.data)
                recovered.forEach((e: any) => {
                    e.client = c
                    Object.setPrototypeOf(e, User.prototype)
                })
                c.ackers = recovered
                c.user?.getAcker().then((freshAckers) => {
                    c.ackers = freshAckers
                    cacheEngine?.set(cachedAckersKey, JSON.stringify(freshAckers))
                })
            } else {
                console.log('no cached ackers found, fetching...')
                opts?.progressCallback?.('loading ackers from network')
                c.ackers = (await c.user?.getAcker()) ?? []
                cacheEngine.set(cachedAckersKey, JSON.stringify(c.ackers))
            }

            const cachedDomainServicesKey = `client-domain-services-${host}`
            const cachedDomainServices = await cacheEngine.get<Record<string, Service>>(cachedDomainServicesKey)
            if (cachedDomainServices) {
                console.log('cached domain services found')
                opts?.progressCallback?.('loading domain services from cache')
                c.domainServices = cachedDomainServices.data
                fetchWithTimeout(`https://${host}/services`, {})
                    .then((res) => res.json())
                    .then((freshServices) => {
                        if (isNonNull(freshServices)) {
                            c.domainServices = freshServices
                            cacheEngine?.set(cachedDomainServicesKey, freshServices)
                        }
                    })
                    .catch((e) => {
                        console.error('CLIENT::create::fetch::error', e)
                    })
            } else {
                console.log('no cached domain services found, fetching...')
                opts?.progressCallback?.('loading domain services from network')
                c.domainServices = await fetchWithTimeout(`https://${host}/services`, {})
                    .then((res) => res.json())
                    .catch((e) => {
                        console.error('CLIENT::create::fetch::error', e)
                        return {}
                    })
                cacheEngine.set(cachedDomainServicesKey, c.domainServices)
            }

            const domainKey = `client-domain-${host}`
            const cachedDomain = await cacheEngine.get<CoreDomain>(domainKey)
            if (cachedDomain) {
                console.log('cached domain found')
                opts?.progressCallback?.('loading domain from cache')
                c.server = cachedDomain.data
                api.getDomain(host, { cache: 'no-cache', timeoutms: 3000 })
                    .then((freshDomain) => {
                        if (isNonNull(freshDomain)) {
                            c.server = freshDomain
                            cacheEngine?.set(domainKey, freshDomain)
                        }
                    })
                    .catch((e) => {
                        console.error('CLIENT::create::getDomain::error', e)
                    })
            } else {
                console.log('no cached domain found, fetching...')
                opts?.progressCallback?.('loading domain from network')
                c.server =
                    (await c.api.getDomain(host, { cache: 'no-cache', timeoutms: 3000 }).catch((e) => {
                        console.error('CLIENT::create::getDomain::error', e)
                        return null
                    })) ?? undefined
                if (c.server) {
                    cacheEngine.set(domainKey, c.server)
                }
            }

            if (c.server) {
                c.isOnline = true
                opts?.progressCallback?.('validating profile')
                if (c.user && !(await c.checkProfileIsOk())) {
                    console.warn('profile is not ok! fixing...')
                    await c.setProfile({})
                }
            } else {
                c.isOnline = false
            }
        }

        opts?.progressCallback?.('done')
        return c
    }

    static async createAsGuest(host: FQDN, _opts?: ClientOptions): Promise<Client> {
        const cacheEngine = new InMemoryKVS()
        const authProvider = new GuestAuthProvider(host)
        const api = new Api(authProvider, cacheEngine)
        const c = new Client(api)

        c.server =
            (await c.api.getDomain(host).catch((e) => {
                console.error('CLIENT::create::getDomain::error', e)
                return null
            })) ?? undefined

        return c
    }

    async reloadUser(): Promise<void> {
        if (!this.ccid) return
        this.user = await this.getUser(this.ccid).catch((e) => {
            console.error('CLIENT::create::getUser::error', e)
            return null
        })
    }

    async reloadAckings(): Promise<void> {
        if (!this.user) return
        this.ackings = await this.user.getAcking()
    }

    async getUser(id: CCID, hint?: string, opts?: Omit<FetchOptions<never>, 'expressGetter'>): Promise<User> {
        return await User.load(this, id, hint, opts)
    }

    async getTimeline<T>(id: TimelineID, opts?: FetchOptions<CoreTimeline<T>>): Promise<Timeline<T> | null> {
        return await Timeline.load(this, id, opts)
    }

    async getAssociation<T>(id: AssociationID, owner: CCID): Promise<Association<T> | null | undefined> {
        return await Association.load(this, id, owner)
    }

    async getMessage<T>(id: MessageID, authorID: CCID, hint?: string): Promise<Message<T> | null | undefined> {
        const cached = this.messageCache[id]

        if (cached && cached.expire > Date.now()) {
            return cached.data
        }

        const message = Message.load(this, id, authorID, hint)

        this.messageCache[id] = {
            data: message,
            expire: Date.now() + cacheLifetime
        }

        return this.messageCache[id].data
    }

    async createMarkdownCrnt(
        body: string,
        timelines: TimelineID[],
        options?: CreateCurrentOptions
    ): Promise<CoreMessage<MarkdownMessageSchema>> {
        let policy
        let policyParams
        let policyDefaults

        if (options?.whisper && options.whisper.length > 0) {
            policy = 'https://policy.concrnt.world/m/whisper.json'
            policyParams = JSON.stringify({
                participants: options.whisper
            })
        }

        if (options?.isPrivate) {
            policyDefaults = JSON.stringify({
                'timeline.message.read': false
            })
        }

        const created = await this.api.createMessage<MarkdownMessageSchema>(
            Schemas.markdownMessage,
            {
                body,
                emojis: options?.emojis,
                profileOverride: options?.profileOverride
            },
            timelines,
            {
                policy,
                policyParams,
                policyDefaults
            }
        )
        if (options?.mentions && options.mentions.length > 0) {
            const associationTimeline = []
            for (const mention of options.mentions) {
                associationTimeline.push('world.concrnt.t-notify@' + mention)
            }
            await this.api.createAssociation(
                Schemas.mentionAssociation,
                {},
                created.id,
                created.author,
                associationTimeline
            )
        }
        return created
    }

    async createPlainTextCrnt(
        body: string,
        timelines: TimelineID[],
        options?: CreatePlaintextCrntOptions
    ): Promise<CoreMessage<MarkdownMessageSchema>> {
        let policy
        let policyParams
        let policyDefaults

        if (options?.whisper && options.whisper.length > 0) {
            policy = 'https://policy.concrnt.world/m/whisper.json'
            policyParams = JSON.stringify({
                participants: options.whisper
            })
        }

        if (options?.isPrivate) {
            policyDefaults = JSON.stringify({
                'timeline.message.read': false
            })
        }

        const newMessage = await this.api.createMessage<PlaintextMessageSchema>(
            Schemas.plaintextMessage,
            {
                body,
                profileOverride: options?.profileOverride
            },
            timelines,
            {
                policy,
                policyParams,
                policyDefaults
            }
        )
        return newMessage
    }

    async createMediaCrnt(
        body: string,
        timelines: TimelineID[],
        options?: CreateMediaCrntOptions
    ): Promise<CoreMessage<MarkdownMessageSchema>> {
        let policy
        let policyParams
        let policyDefaults

        if (options?.whisper && options.whisper.length > 0) {
            policy = 'https://policy.concrnt.world/m/whisper.json'
            policyParams = JSON.stringify({
                participants: options.whisper
            })
        }

        if (options?.isPrivate) {
            policyDefaults = JSON.stringify({
                'timeline.message.read': false
            })
        }

        const newMessage = await this.api.createMessage<MediaMessageSchema>(
            Schemas.mediaMessage,
            {
                body,
                emojis: options?.emojis,
                profileOverride: options?.profileOverride,
                medias: options?.medias
            },
            timelines,
            {
                policy,
                policyParams,
                policyDefaults
            }
        )
        return newMessage
    }

    async getTimelinesBySchema<T>(remote: FQDN, schema: string): Promise<Array<Timeline<T>>> {
        const timelines = await this.api.getTimelineListBySchema<T>(schema, remote)
        return timelines.map((e) => new Timeline<T>(this, e))
    }

    async createCommunityTimeline(body: CommunityTimelineSchema): Promise<CoreTimeline<CommunityTimelineSchema>> {
        if (!this.server) throw new Error('server is not set')
        return await this.api.upsertTimeline<CommunityTimelineSchema>(Schemas.communityTimeline, body, {
            owner: this.server.csid
        })
    }

    async checkProfileIsOk(): Promise<boolean> {
        if (!this.ccid) return false

        const homeTimeline = await this.api.getTimeline('world.concrnt.t-home@' + this.ccid).catch((e) => {
            console.log('CLIENT::checkProfileIsOk::getTimeline::error', e)
            return null
        })
        if (!homeTimeline) {
            return false
        }
        if (
            homeTimeline.policy !== 'https://policy.concrnt.world/t/inline-read-write.json' &&
            !homeTimeline.policyParams
        ) {
            return false
        }
        if (homeTimeline.policyParams) {
            const policyParams = JSON.parse(homeTimeline.policyParams)
            if (policyParams.writer.indexOf(this.ccid) === -1) {
                return false
            }
        }

        const notificationTimeline = await this.api.getTimeline('world.concrnt.t-notify@' + this.ccid).catch((e) => {
            console.log('CLIENT::checkProfileIsOk::getTimeline::error', e)
            return null
        })
        if (!notificationTimeline) {
            return false
        }
        if (
            notificationTimeline.policy !== 'https://policy.concrnt.world/t/inline-read-write.json' &&
            !notificationTimeline.policyParams
        ) {
            return false
        }
        if (notificationTimeline.policyParams) {
            const policyParams = JSON.parse(notificationTimeline.policyParams)
            if (policyParams.reader.indexOf(this.ccid) === -1) {
                return false
            }
        }

        const associationTimeline = await this.api.getTimeline('world.concrnt.t-assoc@' + this.ccid).catch((e) => {
            console.log('CLIENT::checkProfileIsOk::getTimeline::error', e)
            return null
        })
        if (!associationTimeline) {
            return false
        }
        if (
            associationTimeline.policy !== 'https://policy.concrnt.world/t/inline-read-write.json' &&
            !associationTimeline.policyParams
        ) {
            return false
        }
        if (associationTimeline.policyParams) {
            const policyParams = JSON.parse(associationTimeline.policyParams)
            if (policyParams.writer.indexOf(this.ccid) === -1) {
                return false
            }
        }

        const currentprof = await this.api
            .getProfileBySemanticID<ProfileSchema>('world.concrnt.p', this.ccid)
            .catch((e) => {
                console.log('CLIENT::checkProfileIsOk::getProfileBySemanticID::error', e)
                return null
            })
        if (!currentprof) {
            return false
        }

        return true
    }

    async setProfile(updates: {
        username?: string
        description?: string
        avatar?: string
        banner?: string
        subprofiles?: string[]
        badges?: BadgeRef[]
    }): Promise<CoreProfile<ProfileSchema>> {
        if (!this.ccid) throw new Error('ccid is not set')

        const homeTimeline = await this.api.getTimeline('world.concrnt.t-home@' + this.ccid).catch((e) => {
            console.log('CLIENT::setProfile::getTimeline::error', e)
            return null
        })
        if (!homeTimeline) {
            await this.api
                .upsertTimeline(
                    Schemas.emptyTimeline,
                    {},
                    {
                        semanticID: 'world.concrnt.t-home',
                        owner: this.ccid,
                        indexable: false,
                        policy: 'https://policy.concrnt.world/t/inline-read-write.json',
                        policyParams: `{"isWritePublic": false, "isReadPublic": true, "writer": ["${this.ccid}"], "reader": []}`
                    }
                )
                .catch((e) => {
                    console.error('CLIENT::setProfile::upsertTimeline::error', e)
                })
        } else {
            const policy = homeTimeline.policy
            if (policy === 'https://policy.concrnt.world/t/inline-read-write.json') {
                if (homeTimeline.policyParams) {
                    const policyParams = JSON.parse(homeTimeline.policyParams)
                    if (policyParams.writer.indexOf(this.ccid) === -1) {
                        policyParams.writer.push(this.ccid)
                        await this.api
                            .upsertTimeline(
                                Schemas.emptyTimeline,
                                {},
                                {
                                    semanticID: 'world.concrnt.t-home',
                                    owner: this.ccid,
                                    indexable: false,
                                    policy: 'https://policy.concrnt.world/t/inline-read-write.json',
                                    policyParams: JSON.stringify(policyParams)
                                }
                            )
                            .catch((e) => {
                                console.error('CLIENT::setProfile::upsertTimeline::error', e)
                            })
                    }
                } else {
                    await this.api
                        .upsertTimeline(
                            Schemas.emptyTimeline,
                            {},
                            {
                                semanticID: 'world.concrnt.t-home',
                                owner: this.ccid,
                                indexable: false,
                                policy: 'https://policy.concrnt.world/t/inline-read-write.json',
                                policyParams: `{"isWritePublic": false, "isReadPublic": true, "writer": ["${this.ccid}"], "reader": []}`
                            }
                        )
                        .catch((e) => {
                            console.error('CLIENT::setProfile::upsertTimeline::error', e)
                        })
                }
            }
        }

        const notificationTimeline = await this.api.getTimeline('world.concrnt.t-notify@' + this.ccid).catch((e) => {
            console.error('CLIENT::setProfile::getTimeline::error', e)
            return null
        })
        if (!notificationTimeline) {
            await this.api
                .upsertTimeline(
                    Schemas.emptyTimeline,
                    {},
                    {
                        semanticID: 'world.concrnt.t-notify',
                        owner: this.ccid,
                        indexable: false,
                        policy: 'https://policy.concrnt.world/t/inline-read-write.json',
                        policyParams: `{"isWritePublic": true, "isReadPublic": false, "writer": [], "reader": ["${this.ccid}"]}`
                    }
                )
                .catch((e) => {
                    console.error('CLIENT::setProfile::upsertTimeline::error', e)
                })
        } else {
            const policy = notificationTimeline.policy
            if (policy === 'https://policy.concrnt.world/t/inline-read-write.json') {
                if (notificationTimeline.policyParams) {
                    const policyParams = JSON.parse(notificationTimeline.policyParams)
                    if (policyParams.reader.indexOf(this.ccid) === -1) {
                        policyParams.reader.push(this.ccid)
                        await this.api
                            .upsertTimeline(
                                Schemas.emptyTimeline,
                                {},
                                {
                                    semanticID: 'world.concrnt.t-notify',
                                    owner: this.ccid,
                                    indexable: false,
                                    policy: 'https://policy.concrnt.world/t/inline-read-write.json',
                                    policyParams: JSON.stringify(policyParams)
                                }
                            )
                            .catch((e) => {
                                console.error('CLIENT::setProfile::upsertTimeline::error', e)
                            })
                    }
                } else {
                    await this.api
                        .upsertTimeline(
                            Schemas.emptyTimeline,
                            {},
                            {
                                semanticID: 'world.concrnt.t-notify',
                                owner: this.ccid,
                                indexable: false,
                                policy: 'https://policy.concrnt.world/t/inline-read-write.json',
                                policyParams: `{"isWritePublic": true, "isReadPublic": false, "writer": [], "reader": ["${this.ccid}"]}`
                            }
                        )
                        .catch((e) => {
                            console.error('CLIENT::setProfile::upsertTimeline::error', e)
                        })
                }
            }
        }

        const associationTimeline = await this.api.getTimeline('world.concrnt.t-assoc@' + this.ccid).catch((e) => {
            console.error('CLIENT::setProfile::getTimeline::error', e)
            return null
        })
        if (!associationTimeline) {
            await this.api
                .upsertTimeline(
                    Schemas.emptyTimeline,
                    {},
                    {
                        semanticID: 'world.concrnt.t-assoc',
                        owner: this.ccid,
                        indexable: false,
                        policy: 'https://policy.concrnt.world/t/inline-read-write.json',
                        policyParams: `{"isWritePublic": false, "isReadPublic": true, "writer": ["${this.ccid}"], "reader": []}`
                    }
                )
                .catch((e) => {
                    console.error('CLIENT::setProfile::upsertTimeline::error', e)
                })
        } else {
            const policy = associationTimeline.policy
            if (policy === 'https://policy.concrnt.world/t/inline-read-write.json') {
                if (associationTimeline.policyParams) {
                    const policyParams = JSON.parse(associationTimeline.policyParams)
                    if (policyParams.writer.indexOf(this.ccid) === -1) {
                        policyParams.writer.push(this.ccid)
                        await this.api
                            .upsertTimeline(
                                Schemas.emptyTimeline,
                                {},
                                {
                                    semanticID: 'world.concrnt.t-assoc',
                                    owner: this.ccid,
                                    indexable: false,
                                    policy: 'https://policy.concrnt.world/t/inline-read-write.json',
                                    policyParams: JSON.stringify(policyParams)
                                }
                            )
                            .catch((e) => {
                                console.error('CLIENT::setProfile::upsertTimeline::error', e)
                            })
                    }
                } else {
                    await this.api
                        .upsertTimeline(
                            Schemas.emptyTimeline,
                            {},
                            {
                                semanticID: 'world.concrnt.t-assoc',
                                owner: this.ccid,
                                indexable: false,
                                policy: 'https://policy.concrnt.world/t/inline-read-write.json',
                                policyParams: `{"isWritePublic": false, "isReadPublic": true, "writer": ["${this.ccid}"], "reader": []}`
                            }
                        )
                        .catch((e) => {
                            console.error('CLIENT::setProfile::upsertTimeline::error', e)
                        })
                }
            }
        }

        const prof = await this.api.getProfileBySemanticID<ProfileSchema>('world.concrnt.p', this.ccid).catch((e) => {
            console.error('CLIENT::setProfile::getProfileBySemanticID::error', e)
            return null
        })
        const currentprof = prof?.parsedDoc.body

        const updated = await this.api.upsertProfile<ProfileSchema>(
            Schemas.profile,
            {
                username: updates.username ?? currentprof?.username,
                description: updates.description ?? currentprof?.description,
                avatar: updates.avatar ?? currentprof?.avatar,
                banner: updates.banner ?? currentprof?.banner,
                subprofiles: updates.subprofiles ?? currentprof?.subprofiles,
                badges: updates.badges ?? currentprof?.badges
            },
            { semanticID: 'world.concrnt.p' }
        )

        this.api.invalidateProfile(`world.concrnt.p@${this.ccid}`)

        await this.reloadUser()

        return updated
    }

    async newSocket(host?: string): Promise<Socket> {
        const targetHost = host ?? this.host
        if (!this.sockets[targetHost]) {
            this.sockets[targetHost] = new Socket(this.api, host)
            await this.sockets[targetHost].waitOpen()
        }
        return this.sockets[targetHost]
    }

    async newSocketListener(host?: string): Promise<SocketListener> {
        const socket = await this.newSocket(host)
        return new SocketListener(socket)
    }

    async newTimelineReader(opts?: { withoutSocket: boolean; hostOverride?: string }): Promise<TimelineReader> {
        if (opts?.withoutSocket) {
            return new TimelineReader(this.api, undefined)
        }
        const socket = await this.newSocket(opts?.hostOverride)
        return new TimelineReader(this.api, socket, opts?.hostOverride)
    }

    async newTimelineQuery(): Promise<QueryTimelineReader> {
        return new QueryTimelineReader(this.api)
    }
}

export class User implements Omit<CoreEntity, 'parsedAffiliationDoc' | 'parsedTombstoneDoc'> {
    client: Client

    // ---------- //

    ccid: CCID
    alias?: string
    tag: string
    domain: FQDN
    cdate: string
    score: number
    affiliationDocument: string
    affiliationSignature: string
    tombstoneDocument?: string
    tombstoneSignature?: string

    // ---------- //

    profile?: UserProfile

    get notificationTimeline(): string {
        return 'world.concrnt.t-notify@' + this.ccid
    }

    get associationTimeline(): string {
        return 'world.concrnt.t-assoc@' + this.ccid
    }

    get homeTimeline(): string {
        return 'world.concrnt.t-home@' + this.ccid
    }

    toJSON(): any {
        return {
            ccid: this.ccid,
            alias: this.alias,
            tag: this.tag,
            domain: this.domain,
            cdate: this.cdate,
            score: this.score,
            affiliationDocument: this.affiliationDocument,
            affiliationSignature: this.affiliationSignature,
            tombstoneDocument: this.tombstoneDocument,
            tombstoneSignature: this.tombstoneSignature
        }
    }

    constructor(client: Client, domain: FQDN, entity: CoreEntity, profile?: ProfileSchema) {
        this.client = client
        this.domain = domain
        this.profile = {
            ccid: entity.ccid,
            alias: entity.alias,
            ...profile
        }

        this.ccid = entity.ccid
        this.alias = entity.alias
        this.tag = entity.tag
        this.cdate = entity.cdate
        this.score = entity.score
        this.affiliationDocument = entity.affiliationDocument
        this.affiliationSignature = entity.affiliationSignature
        this.tombstoneDocument = entity.tombstoneDocument
        this.tombstoneSignature = entity.tombstoneSignature
    }

    static async load(
        client: Client,
        id: CCID,
        hint?: string,
        opts?: Omit<FetchOptions<never>, 'expressGetter'>
    ): Promise<User> {
        const domain = await client.api.resolveDomain(id, hint).catch((_e) => {
            throw new Error('domain not found')
        })
        const entity = await client.api.getEntity(id, undefined, { cache: 'best-effort', ...opts }).catch((_e) => {
            throw new Error('entity not found')
        })

        const profile = await client.api
            .getProfileBySemanticID<ProfileSchema>('world.concrnt.p', id, { cache: 'best-effort', ...opts })
            .catch((_e) => {
                console.warn('profile not found')
            })

        return new User(client, domain, entity, profile?.parsedDoc.body ?? undefined)
    }

    async getAcking(): Promise<User[]> {
        const acks = await this.client.api.getAcking(this.ccid)
        const results = await Promise.allSettled(acks.map((e) => User.load(this.client, e.to)))

        const succeeded = results.filter(isFulfilled)
        return succeeded.map((e) => e.value)
    }

    async getAcker(): Promise<User[]> {
        const acks = await this.client.api.getAcker(this.ccid)
        const results = await Promise.allSettled(acks.map((e) => User.load(this.client, e.from)))

        const succeeded = results.filter(isFulfilled)
        return succeeded.map((e) => e.value)
    }

    async Ack(): Promise<void> {
        await this.client.api.ack(this.ccid)
        await this.client.reloadAckings()
    }

    async UnAck(): Promise<void> {
        await this.client.api.unack(this.ccid)
        await this.client.reloadAckings()
    }
}

export class Association<T> implements Omit<CoreAssociation<T>, 'document' | 'parsedDoc'> {
    client: Client

    // ---------- //

    id: AssociationID
    author: CCID
    owner: CCID | CSID
    schema: string
    signature: string
    target: MessageID
    variant: string
    timelines: TimelineID[]
    cdate: string

    // ---------- //

    document: CCDocument.Association<T>
    _document: string
    authorUser?: User
    authorProfile: UserProfile
    get targetType(): 'messages' | 'characters' {
        if (this.target[0] === 'm') {
            return 'messages'
        } else {
            return 'characters'
        }
    }

    constructor(client: Client, data: CoreAssociation<T>) {
        this.client = client

        this.id = data.id
        this.author = data.author
        this.owner = data.owner
        this.schema = data.schema
        this.signature = data.signature
        this.target = data.target
        this.cdate = data.cdate
        this.variant = data.variant
        this.timelines = data.timelines

        this.document = JSON.parse(data.document)
        this._document = data.document

        this.authorProfile = {
            ccid: this.author
        }
    }

    toJSON(): any {
        return {
            id: this.id,
            author: this.author,
            owner: this.owner,
            schema: this.schema,
            document: this._document,
            signature: this.signature,
            target: this.target,
            cdate: this.cdate
        }
    }

    static async load<T>(client: Client, id: AssociationID, owner: CCID): Promise<Association<T> | null> {
        const coreAss = await client.api.getAssociationWithOwner<T>(id, owner).catch((e) => {
            console.error('CLIENT::getAssociation::readAssociationWithOwner::error', e)
            return null
        })
        if (!coreAss) return null

        const association = new Association<any>(client, coreAss)
        association.authorUser = (await client.getUser(association.author)) ?? undefined

        association.owner = owner

        association.authorProfile = { ...association.authorProfile, ...association.authorUser?.profile }
        association.authorProfile.alias = association.authorUser?.alias

        if (association.document.body.profileOverride) {
            if (association.document.body.profileOverride.username) {
                association.authorProfile.original = {
                    ...association.authorProfile.original,
                    username: association.authorProfile.username
                }
                association.authorProfile.username = association.document.body.profileOverride.username
            }
            if (association.document.body.profileOverride.avatar) {
                association.authorProfile.original = {
                    ...association.authorProfile.original,
                    avatar: association.authorProfile.avatar
                }
                association.authorProfile.avatar = association.document.body.profileOverride.avatar
            }
            if (association.document.body.profileOverride.profileID) {
                association.authorProfile.profileOverrideID = association.document.body.profileOverride.profileID
                const profileOverride = await client.api
                    .getProfile<ProfileSchema>(association.document.body.profileOverride.profileID, association.author)
                    .catch((e) => {
                        console.error('CLIENT::getAssociation::getProfile::error', e)
                        return null
                    })
                if (profileOverride) {
                    if (profileOverride.parsedDoc.body.username) {
                        association.authorProfile.original = {
                            ...association.authorProfile.original,
                            username: association.authorProfile.username
                        }
                        association.authorProfile.username = profileOverride.parsedDoc.body.username
                    }
                    if (profileOverride.parsedDoc.body.avatar) {
                        association.authorProfile.original = {
                            ...association.authorProfile.original,
                            avatar: association.authorProfile.avatar
                        }
                        association.authorProfile.avatar = profileOverride.parsedDoc.body.avatar
                    }
                }
            }
        }

        return association
    }

    static async loadByBody<T>(client: Client, body: CoreAssociation<T>): Promise<Association<T> | null> {
        const association = new Association<any>(client, body)
        association.authorUser = (await client.getUser(association.author)) ?? undefined

        association.authorProfile = { ...association.authorProfile, ...association.authorUser?.profile }
        association.authorProfile.alias = association.authorUser?.alias

        if (association.document.body.profileOverride) {
            if (association.document.body.profileOverride.username) {
                association.authorProfile.original = {
                    ...association.authorProfile.original,
                    username: association.authorProfile.username
                }
                association.authorProfile.username = association.document.body.profileOverride.username
            }
            if (association.document.body.profileOverride.avatar) {
                association.authorProfile.original = {
                    ...association.authorProfile.original,
                    avatar: association.authorProfile.avatar
                }
                association.authorProfile.avatar = association.document.body.profileOverride.avatar
            }
            if (association.document.body.profileOverride.profileID) {
                association.authorProfile.profileOverrideID = association.document.body.profileOverride.profileID
                const profileOverride = await client.api
                    .getProfile<ProfileSchema>(association.document.body.profileOverride.profileID, association.author)
                    .catch((e) => {
                        console.error('CLIENT::getAssociation::getProfile::error', e)
                        return null
                    })
                if (profileOverride) {
                    if (profileOverride.parsedDoc.body.username) {
                        association.authorProfile.original = {
                            ...association.authorProfile.original,
                            username: association.authorProfile.username
                        }
                        association.authorProfile.username = profileOverride.parsedDoc.body.username
                    }
                    if (profileOverride.parsedDoc.body.avatar) {
                        association.authorProfile.original = {
                            ...association.authorProfile.original,
                            avatar: association.authorProfile.avatar
                        }
                        association.authorProfile.avatar = profileOverride.parsedDoc.body.avatar
                    }
                }
            }
        }

        return association
    }

    async getAuthor(): Promise<User> {
        const author = await this.client.getUser(this.author)
        if (!author) throw new Error('author not found')
        return author
    }

    async getTargetMessage(): Promise<Message<any>> {
        if (this.targetType !== 'messages') throw new Error(`target is not message (actual: ${this.targetType})`)
        if (!this.owner) throw new Error('owner is not set')
        const message = await this.client.getMessage(this.target, this.owner)
        if (!message) throw new Error('target message not found')
        return message
    }

    async delete(): Promise<void> {
        const { content } = await this.client.api.deleteAssociation(this.id, this.owner ?? this.author)
        this.client.api.invalidateMessage(content.target)
    }
}

export class Timeline<T> implements Omit<CoreTimeline<T>, 'document' | 'parsedDoc' | 'policy' | 'policyParams'> {
    client: Client

    // ---------- //

    id: TimelineID
    indexable: boolean
    owner: CCID | CSID
    author: CCID
    schema: string
    policy: Policy
    document: CCDocument.Timeline<T>
    signature: string
    cdate: string
    mdate: string

    // ---------- //

    _document: string
    fqid: string = ''
    host: string = ''

    constructor(client: Client, data: CoreTimeline<T>) {
        this.client = client

        this.id = data.id
        this.indexable = data.indexable
        this.owner = data.owner
        this.author = data.author
        this.schema = data.schema
        this.document = JSON.parse(data.document)
        this._document = data.document
        this.signature = data.signature
        this.cdate = data.cdate
        this.mdate = data.mdate
        this.policy = loadPolicy(data.policy, data.policyParams, this)
    }

    toJSON(): any {
        return {
            id: this.id,
            indexable: this.indexable,
            owner: this.owner,
            author: this.author,
            schema: this.schema,
            document: this._document,
            signature: this.signature,
            cdate: this.cdate,
            mdate: this.mdate,
            policy: this.policy?.getPolicySchemaURL(),
            policyParams: this.policy?.getPolicyParams()
        }
    }

    static async load<T>(
        client: Client,
        id: TimelineID,
        opts?: FetchOptions<CoreTimeline<T>>
    ): Promise<Timeline<T> | null> {
        const coreTimeline = await client.api.getTimeline<T>(id, opts).catch((_e) => {
            return null
        })
        if (!coreTimeline) return null

        const timeline = new Timeline<T>(client, coreTimeline)

        const host = await client.api.resolveDomain(coreTimeline.owner)
        timeline.host = host
        if (IsCSID(coreTimeline.owner)) {
            timeline.fqid = coreTimeline.id + '@' + host
        } else {
            timeline.fqid = coreTimeline.id + '@' + coreTimeline.owner
        }

        return timeline
    }

    async getAssociations(): Promise<Array<Association<any>>> {
        const coreass = await this.client.api.getTimelineAssociations(this.fqid)
        const ass: Array<Association<any> | null> = await Promise.all(
            coreass.map((e) => Association.loadByBody<any>(this.client, e))
        )
        return ass.filter(isNonNull)
    }

    invalidate(): void {
        this.fqid && this.client.api.invalidateTimeline(this.fqid)
    }
}

export class Message<T> implements Omit<CoreMessage<T>, 'document' | 'policyParams' | 'parsedDoc' | 'parsedPolicy'> {
    client: Client

    // ---------- //
    id: MessageID
    author: CCID
    schema: string
    document: CCDocument.Message<T>
    signature: string
    timelines: TimelineID[]
    policy?: string
    policyParams: any
    associations: Array<CoreAssociation<any>>
    ownAssociations: Array<CoreAssociation<any>>
    cdate: string
    // ---------- //

    _document: string
    _policyParams?: string
    authorUser?: User
    authorProfile: UserProfile
    associationCounts?: Record<string, number>
    reactionCounts?: Record<string, number>
    postedTimelines?: Array<Timeline<any>>
    onUpdate?: () => void

    constructor(client: Client, data: CoreMessage<T>) {
        this.client = client
        this.associations = data.associations ?? []
        this.ownAssociations = data.ownAssociations ?? []
        this.author = data.author
        this.cdate = data.cdate
        this.id = data.id
        this._document = data.document
        this.document = JSON.parse(data.document)
        this.authorProfile = {
            ccid: this.author
        }
        this.schema = data.schema as Schema
        this.signature = data.signature
        this.timelines = data.timelines
        this.policy = data.policy
        this._policyParams = data.policyParams
        if (data.policyParams) {
            try {
                this.policyParams = JSON.parse(data.policyParams)
            } catch (e) {
                console.error('CLIENT::Timeline::constructor::error', e)
            }
        }
    }

    toJSON(): any {
        return {
            associations: this.associations,
            ownAssociations: this.ownAssociations,
            author: this.author,
            cdate: this.cdate,
            id: this.id,
            document: this.document,
            schema: this.schema,
            signature: this.signature,
            timelines: this.timelines,
            policy: this.policy,
            policyParams: this.policyParams,
            associationCounts: this.associationCounts,
            reactionCounts: this.reactionCounts,
            postedTimelines: this.postedTimelines,
            authorUser: this.authorUser
        }
    }

    static async load<T>(client: Client, id: MessageID, authorID: CCID, hint?: string): Promise<Message<T> | null> {
        const coreMsg = await client.api.getMessageWithAuthor<T>(id, authorID, hint)
        if (!coreMsg) return null

        const message = new Message<any>(client, coreMsg)

        message.authorUser = (await client.getUser(authorID)) ?? undefined
        message.associationCounts = await client.api.getMessageAssociationCountsByTarget(id, authorID)
        message.reactionCounts = await client.api.getMessageAssociationCountsByTarget(id, authorID, {
            schema: Schemas.reactionAssociation
        })
        message.authorProfile = { ...message.authorProfile, ...message.authorUser?.profile }
        message.authorProfile.alias = message.authorUser?.alias
        if (message.document.body.profileOverride) {
            if (message.document.body.profileOverride.username) {
                message.authorProfile.original = {
                    ...message.authorProfile.original,
                    username: message.authorProfile.username
                }
                message.authorProfile.username = message.document.body.profileOverride.username
            }
            if (message.document.body.profileOverride.avatar) {
                message.authorProfile.original = {
                    ...message.authorProfile.original,
                    avatar: message.authorProfile.avatar
                }
                message.authorProfile.avatar = message.document.body.profileOverride.avatar
            }
            if (message.document.body.profileOverride.profileID) {
                message.authorProfile.profileOverrideID = message.document.body.profileOverride.profileID
                const overrideProfile = await client.api
                    .getProfile<ProfileSchema>(message.document.body.profileOverride.profileID, message.author)
                    .catch((e) => {
                        console.error('CLIENT::getMessage::getProfile::error', e)
                        return null
                    })
                if (overrideProfile) {
                    if (overrideProfile.parsedDoc.body.username) {
                        message.authorProfile.original = {
                            ...message.authorProfile.original,
                            username: message.authorProfile.username
                        }
                        message.authorProfile.username = overrideProfile.parsedDoc.body.username
                    }
                    if (overrideProfile.parsedDoc.body.avatar) {
                        message.authorProfile.original = {
                            ...message.authorProfile.original,
                            avatar: message.authorProfile.avatar
                        }
                        message.authorProfile.avatar = overrideProfile.parsedDoc.body.avatar
                    }
                }
            }
        }

        const timelines_request = await Promise.allSettled(message.timelines.map((e) => client.getTimeline(e)))
        const timelines_fulfilled = timelines_request.filter(isFulfilled)
        message.postedTimelines = timelines_fulfilled.map((e) => e.value).filter(isNonNull)

        return message
    }

    async getAuthor(): Promise<User> {
        const author = await this.client.getUser(this.author)
        if (!author) {
            throw new Error('Author not found')
        }
        return author
    }

    async getTimelines<T>(): Promise<Array<Timeline<T>>> {
        const timelines = await Promise.all(this.timelines.map((e) => this.client.getTimeline<T>(e)))
        return timelines.filter(isNonNull)
    }

    async getReplyAssociations(): Promise<Array<Association<ReplyAssociationSchema>>> {
        const coreass = await this.client.api.getMessageAssociationsByTarget<ReplyAssociationSchema>(
            this.id,
            this.author,
            { schema: Schemas.replyAssociation }
        )
        const ass: Array<Association<ReplyAssociationSchema> | null> = await Promise.all(
            coreass.map((e) => Association.loadByBody<ReplyAssociationSchema>(this.client, e))
        )
        return ass.filter(isNonNull)
    }

    async getRerouteAssociations(): Promise<Array<Association<RerouteAssociationSchema>>> {
        const coreass = await this.client.api.getMessageAssociationsByTarget<RerouteAssociationSchema>(
            this.id,
            this.author,
            { schema: Schemas.rerouteAssociation }
        )
        const ass: Array<Association<RerouteAssociationSchema> | null> = await Promise.all(
            coreass.map((e) => Association.loadByBody<RerouteAssociationSchema>(this.client, e))
        )
        return ass.filter(isNonNull)
    }

    async getReplyMessages(): Promise<
        Array<{ association?: Association<ReplyAssociationSchema>; message?: Message<ReplyMessageSchema> }>
    > {
        const associations = await this.client.api.getMessageAssociationsByTarget<ReplyAssociationSchema>(
            this.id,
            this.author,
            { schema: Schemas.replyAssociation }
        )
        const results = await Promise.all(
            associations.map(async (e) => {
                const assDoc = e.parsedDoc
                return {
                    association: (await Association.loadByBody<ReplyAssociationSchema>(this.client, e)) ?? undefined,
                    message:
                        (await this.client.getMessage<ReplyMessageSchema>(
                            assDoc.body.messageId,
                            assDoc.body.messageAuthor
                        )) ?? undefined
                }
            })
        )
        return results
    }

    async getRerouteMessages(): Promise<
        Array<{ association?: Association<RerouteAssociationSchema>; message?: Message<RerouteMessageSchema> }>
    > {
        const associations = await this.client.api.getMessageAssociationsByTarget<RerouteAssociationSchema>(
            this.id,
            this.author,
            { schema: Schemas.rerouteAssociation }
        )
        const results = await Promise.all(
            associations.map(async (e) => {
                const assDoc = e.parsedDoc
                return {
                    association: (await Association.loadByBody<RerouteAssociationSchema>(this.client, e)) ?? undefined,
                    message:
                        (await this.client.getMessage<RerouteMessageSchema>(
                            assDoc.body.messageId,
                            assDoc.body.messageAuthor
                        )) ?? undefined
                }
            })
        )
        return results
    }

    async getFavorites(): Promise<Array<Association<LikeAssociationSchema>>> {
        const coreass = await this.client.api.getMessageAssociationsByTarget<LikeAssociationSchema>(
            this.id,
            this.author,
            { schema: Schemas.likeAssociation }
        )
        const ass: Array<Association<LikeAssociationSchema> | null> = await Promise.all(
            coreass.map((e) => Association.loadByBody<LikeAssociationSchema>(this.client, e))
        )
        return ass.filter(isNonNull)
    }

    async getReactions(imgUrl?: string): Promise<Array<Association<ReactionAssociationSchema>>> {
        let query: any = { schema: Schemas.reactionAssociation }
        if (imgUrl) {
            query = { schema: Schemas.reactionAssociation, variant: imgUrl }
        }
        const coreass = await this.client.api.getMessageAssociationsByTarget<ReactionAssociationSchema>(
            this.id,
            this.author,
            query
        )
        const ass: Array<Association<ReactionAssociationSchema> | null> = await Promise.all(
            coreass.map((e) => Association.loadByBody<ReactionAssociationSchema>(this.client, e))
        )
        return ass.filter(isNonNull)
    }

    async getReplyTo(): Promise<Message<ReplyMessageSchema> | null> {
        if (this.schema !== Schemas.replyMessage) {
            throw new Error('This message is not a reply')
        }
        const replyPayload = this.document.body as ReplyMessageSchema
        return await Message.load<ReplyMessageSchema>(
            this.client,
            replyPayload.replyToMessageId,
            replyPayload.replyToMessageAuthor
        )
    }

    async GetRerouteTo(): Promise<Message<RerouteMessageSchema> | null> {
        if (this.schema !== Schemas.rerouteMessage) {
            throw new Error('This message is not a reroute')
        }
        const reroutePayload = this.document.body as RerouteMessageSchema
        return await Message.load<RerouteMessageSchema>(
            this.client,
            reroutePayload.rerouteMessageId,
            reroutePayload.rerouteMessageAuthor
        )
    }

    async favorite(): Promise<CoreAssociation<LikeAssociationSchema>> {
        const author = await this.getAuthor()
        const user = this.client.user
        if (!user) throw new Error('user is not set')
        const targetTimeline = ['world.concrnt.t-notify@' + author.ccid, 'world.concrnt.t-assoc@' + user.ccid]

        const dummyAssocBase: Omit<CoreAssociation<LikeAssociationSchema>, 'parsedDoc'> = {
            id: new Date().getTime().toString(),
            author: user.ccid,
            owner: author.ccid,
            schema: Schemas.likeAssociation,
            target: this.id,
            variant: '',
            timelines: targetTimeline,
            cdate: new Date().toISOString(),
            document: JSON.stringify({
                type: 'association',
                body: {},
                schema: Schemas.likeAssociation,
                signer: user.ccid,
                target: this.id,
                owner: this.author,
                variant: '',
                timelines: targetTimeline,
                signedAt: new Date()
            }),
            signature: 'DUMMY'
        }

        const dummyAssoc = Object.setPrototypeOf(dummyAssocBase, Association.prototype)

        this.associations.push(dummyAssoc)
        this.ownAssociations.push(dummyAssoc)
        if (this.associationCounts) {
            this.associationCounts[Schemas.likeAssociation] = (this.associationCounts[Schemas.likeAssociation] ?? 0) + 1
        }
        this.onUpdate?.()

        const result = this.client.api
            .createAssociation<LikeAssociationSchema>(Schemas.likeAssociation, {}, this.id, author.ccid, targetTimeline)
            .then((resp) => {
                return resp
            })
            .catch((e) => {
                this.deleteAssociation(dummyAssoc)
                return Promise.reject(e)
            })
        return await result
    }

    async reaction(shortcode: string, imageUrl: string): Promise<CoreAssociation<ReactionAssociationSchema>> {
        const author = await this.getAuthor()
        const user = this.client.user
        if (!user) throw new Error('user is not set')
        const targetTimeline = ['world.concrnt.t-notify@' + author.ccid, 'world.concrnt.t-assoc@' + user.ccid]

        const dummyAssocBase: Omit<CoreAssociation<ReactionAssociationSchema>, 'parsedDoc'> = {
            id: new Date().getTime().toString(),
            author: user.ccid,
            owner: author.ccid,
            schema: Schemas.reactionAssociation,
            target: this.id,
            variant: imageUrl,
            timelines: targetTimeline,
            cdate: new Date().toISOString(),
            document: JSON.stringify({
                type: 'association',
                body: {
                    shortcode,
                    imageUrl
                },
                schema: Schemas.reactionAssociation,
                signer: user.ccid,
                target: this.id,
                owner: this.author,
                variant: '',
                timelines: targetTimeline,
                signedAt: new Date()
            }),
            signature: 'DUMMY'
        }

        const dummyAssoc = Object.setPrototypeOf(dummyAssocBase, CoreAssociation.prototype)

        this.associations.push(dummyAssoc)
        this.ownAssociations.push(dummyAssoc)
        if (this.reactionCounts) {
            this.reactionCounts[imageUrl] = (this.reactionCounts[imageUrl] ?? 0) + 1
        }
        this.onUpdate?.()

        const result = this.client.api
            .createAssociation<ReactionAssociationSchema>(
                Schemas.reactionAssociation,
                {
                    shortcode,
                    imageUrl
                },
                this.id,
                author.ccid,
                targetTimeline,
                imageUrl
            )
            .then((resp) => {
                this.client.api.invalidateMessage(this.id)
                return resp
            })
            .catch((e) => {
                this.deleteAssociation(dummyAssoc)
                return Promise.reject(e)
            })
        return await result
    }

    async upgrade(txhash: string): Promise<CoreAssociation<UpgradeAssociationSchema>> {
        const author = await this.getAuthor()
        const user = this.client.user
        if (!user) throw new Error('user is not set')
        const targetTimeline = ['world.concrnt.t-notify@' + author.ccid, 'world.concrnt.t-assoc@' + user.ccid]
        const result = await this.client.api.createAssociation<UpgradeAssociationSchema>(
            Schemas.upgradeAssociation,
            {
                txhash
            },
            this.id,
            author.ccid,
            targetTimeline,
            txhash
        )
        this.client.api.invalidateMessage(this.id)
        return result
    }

    async deleteAssociation(a: CoreAssociation<any>): Promise<void> {
        if (this.associationCounts) {
            this.associationCounts[a.schema] = (this.associationCounts[a.schema] ?? 0) - 1
            if (this.associationCounts[a.schema] <= 0) {
                delete this.associationCounts[a.schema]
            }
        }

        const document = a.parsedDoc

        if (a.schema === Schemas.reactionAssociation) {
            if (this.reactionCounts) {
                this.reactionCounts[document.body.imageUrl] = (this.reactionCounts[document.body.imageUrl] ?? 0) - 1
                if (this.reactionCounts[document.body.imageUrl] <= 0) {
                    delete this.reactionCounts[document.body.imageUrl]
                }
            }
        }

        this.associations = this.associations.filter((e) => e.id !== a.id)
        this.ownAssociations = this.ownAssociations.filter((e) => e.id !== a.id)

        this.onUpdate?.()

        await this.client.api.deleteAssociation(a.id, this.author)
    }

    async reply(timelines: string[], body: string, options?: CreateCurrentOptions): Promise<void> {
        const user = this.client.user
        if (!user) throw new Error('user is not set')

        let policy
        let policyParams

        if (options?.whisper && options.whisper.length > 0) {
            policy = 'https://policy.concrnt.world/m/whisper.json'
            policyParams = JSON.stringify({
                participants: options.whisper
            })
        }

        const created = await this.client.api.createMessage<ReplyMessageSchema>(
            Schemas.replyMessage,
            {
                body,
                replyToMessageId: this.id,
                replyToMessageAuthor: this.author,
                emojis: options?.emojis,
                profileOverride: options?.profileOverride
            },
            timelines,
            {
                policy,
                policyParams
            }
        )

        const author = await this.getAuthor()
        const targetTimeline = ['world.concrnt.t-notify@' + author.ccid, 'world.concrnt.t-assoc@' + user.ccid]

        await this.client.api.createAssociation<ReplyAssociationSchema>(
            Schemas.replyAssociation,
            { messageId: created.id, messageAuthor: created.author },
            this.id,
            this.author,
            targetTimeline || []
        )
    }

    async reroute(timelines: string[], body?: string, options?: CreateCurrentOptions): Promise<void> {
        const user = this.client.user
        if (!user) throw new Error('user is not set')

        let policy
        let policyParams

        if (options?.whisper && options.whisper.length > 0) {
            policy = 'https://policy.concrnt.world/m/whisper.json'
            policyParams = JSON.stringify({
                participants: options.whisper
            })
        }

        const created = await this.client.api.createMessage<RerouteMessageSchema>(
            Schemas.rerouteMessage,
            {
                body,
                rerouteMessageId: this.id,
                rerouteMessageAuthor: this.author,
                emojis: options?.emojis,
                profileOverride: options?.profileOverride
            },
            timelines,
            {
                policy,
                policyParams
            }
        )

        const author = await this.getAuthor()
        const targetTimeline = ['world.concrnt.t-notify@' + author.ccid, 'world.concrnt.t-assoc@' + user.ccid]

        await this.client.api.createAssociation<RerouteAssociationSchema>(
            Schemas.rerouteAssociation,
            { messageId: created.id, messageAuthor: created.author },
            this.id,
            this.author,
            targetTimeline
        )
    }

    async delete(): Promise<void> {
        this.client.api.invalidateMessage(this.id)
        return await this.client.api.deleteMessage(this.id)
    }
}
