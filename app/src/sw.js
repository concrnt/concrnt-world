import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

const seed = 'ariake.concrnt.net' // TODO: find a way to sync with the main app

const resolveHost = async (ccid) => {
    const response = await fetch(`https://${seed}/api/v1/entity/${ccid}`)
    const data = await response.json()
    const content = data.content
    return content.domain
}

const getProfile = async (ccid) => {
    const host = await resolveHost(ccid)
    const response = await fetch(`https://${host}/api/v1/profile/${ccid}/world.concrnt.p`)
    const data = await response.json()
    const document = JSON.parse(data.content.document)
    return document
}

const getMessage = async (id, owner) => {
    const host = await resolveHost(owner)
    const response = await fetch(`https://${host}/api/v1/message/${id}`)
    const data = await response.json()
    const document = JSON.parse(data.content.document)
    return document
}

self.addEventListener('push', (event) => {
    console.log(`[Service Worker] Push had this data: "${event.data.text()}"`)
    const notify = async () => {
        const document = event.data.json()

        let url = '/'

        let title = ''
        let body = ''
        let icon = '/192.png'
        let badge = undefined

        let signer = undefined
        let username = document.body.profileOverride?.username
        if (!username) {
            try {
                signer = await getProfile(document.signer)
                username = signer.body.username
            } catch (error) {
                console.log(error)
            }
        }

        if (!username) {
            username = 'Anonymouse'
        }

        switch (document.schema) {
            case Schemas.likeAssociation: {
                // Like
                title = `${username} さんがあなたの投稿にいいねしました`
                url = `/${document.owner}/${document.target}`
                try {
                    const message = await getMessage(document.target, document.owner)
                    body = message.body.body
                } catch (error) {
                    console.log(error)
                }

                break
            }
            case Schemas.reactionAssociation: {
                // Reaction
                title = `${username} さんがあなたの投稿にリアクションしました :${document.body.shortcode}:`
                url = `/${document.owner}/${document.target}`
                try {
                    const message = await getMessage(document.target, document.owner)
                    body = message.body.body
                    if (document.body.imageUrl) {
                        badge = `https://ariake.concrnt.net/image/96x/${document.body.imageUrl}`
                    }
                } catch (error) {
                    console.log(error)
                }

                break
            }
            case Schemas.rerouteAssociation: {
                // Reroute
                title = `${username} さんがあなたの投稿をリルートしました`
                url = `/${document.owner}/${document.target}`
                try {
                    const message = await getMessage(document.target, document.owner)
                    body = message.body.body
                } catch (error) {
                    console.log(error)
                }

                break
            }
            case Schemas.replyAssociation: {
                // Reply
                title = `${username} さんがあなたの投稿にリプライしました`
                url = `/${document.body.messageAuthor}/${document.body.messageId}`
                try {
                    const message = await getMessage(document.body.messageId, document.body.messageAuthor)
                    body = message.body.body
                    if (signer?.body?.avatar) {
                        icon = `https://ariake.concrnt.net/image/128x/${signer.body.avatar}`
                    }
                } catch (error) {
                    console.log(error)
                }

                break
            }
            case Schemas.mentionAssociation: {
                // Mention
                title = `${username} さんがあなたをメンションしました`
                url = `/${document.owner}/${document.target}`
                try {
                    const message = await getMessage(document.target, document.owner)
                    body = message.body.body
                    if (signer?.body?.avatar) {
                        icon = `https://ariake.concrnt.net/image/128x/${signer.body.avatar}`
                    }
                } catch (error) {
                    console.log(error)
                }

                break
            }
            case Schemas.readAccessRequestAssociation: {
                // Read Access Request
                title = `${username} さんが閲覧リクエストを送信しています`
                url = `/notifications`
                break
            }

            default:
                break
        }
        return self.registration.showNotification(title, {
            body,
            icon,
            badge,
            data: {
                url
            }
        })
    }

    event.waitUntil(notify())
})

self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification click Received.')

    event.notification.close()

    const handle = clients
        .matchAll({
            type: 'window',
            includeUncontrolled: true
        })
        .then((clientList) => {
            let matchingClient = clientList[0]

            if (matchingClient) {
                return matchingClient.postMessage({
                    type: 'navigate',
                    url: event.notification.data.url
                })
            } else {
                return clients.openWindow(event.notification.data.url)
            }
        })

    event.waitUntil(handle)
})

const Schemas = {
    markdownMessage: 'https://schema.concrnt.world/m/markdown.json',
    replyMessage: 'https://schema.concrnt.world/m/reply.json',
    rerouteMessage: 'https://schema.concrnt.world/m/reroute.json',
    plaintextMessage: 'https://schema.concrnt.world/m/plaintext.json',
    mediaMessage: 'https://schema.concrnt.world/m/media.json',

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
}

self.addEventListener('message', (event) => {
    console.log('SW Received Message: ', event.data)
    if (event.data && event.data.type === 'SKIP_WAITING') {
        cleanupOutdatedCaches()
        self.skipWaiting()
    }
})

precacheAndRoute(self.__WB_MANIFEST)

const APP_VERSION = self.__APP_VERSION__ || '0'
const appAssetsCache = `app-assets-v${APP_VERSION}`

const sameOriginAsset = (url) => {
    const match =
        url.origin === self.location.origin &&
        /\.(?:js|css|woff2?|ttf|json|png|jpg|jpeg|gif|webp|svg|ico|mp3|mp4|webm|wasm)$/.test(url.pathname)
    if (match) console.log('cacheable asset', url.href)
    return match
}

registerRoute(
    ({ url }) => sameOriginAsset(url),
    new CacheFirst({
        cacheName: appAssetsCache,
        plugins: [
            new CacheableResponsePlugin({ statuses: [0, 200] }),
            new ExpirationPlugin({
                maxEntries: 500,
                purgeOnQuotaError: true
            })
        ]
    })
)
