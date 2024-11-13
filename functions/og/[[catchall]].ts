import type {
    ApiResponse, CoreEntity, CoreMessage, CoreProfile, WorldMessage, WorldProfile
} from '../types/concurrent'
import { sanitizeHtml } from '../lib/sanitize'
import { CACHE_TTL_SECONDS, CCWORLD } from '../constants'

// catchall: [ccid, messageId]

export const onRequest: PagesFunction = async (context) => {

    const url = new URL(context.request.url)
    const cacheKey = url.origin + url.pathname
    const originalPath = CCWORLD + url.pathname.replace('/og', '')

    if (url.pathname.split('/').length !== 4) {
        // redirect to home
        return Response.redirect(
            CCWORLD,
            301
        )
    }

    // Cloudflare Workersの@CacheStorageタイプはcaches.defaultがあるが、ブラウザのCacheStorageはcaches.defaultがないのでエラーが出る
    // @ts-ignore
    const cache = caches.default
    let response = await cache.match(cacheKey)

    if (!response) {

        const [ccid, messageId] = context.params.catchall

        const entity: CoreEntity = await fetch(`https://ariake.concrnt.net/api/v1/entity/${ccid}`)
            .then((response) => response.json<ApiResponse<CoreEntity>>())
            .then((data) => data.content)
        if (!entity) {
            return Response.redirect(
                CCWORLD,
                301
            )
        }

        const message: CoreMessage = await fetch(`https://${entity.domain}/api/v1/message/${messageId}`)
            .then((response) => response.json<ApiResponse<CoreMessage>>())
            .then((data) => data.content)
        if (!message) {
            return Response.redirect(
                CCWORLD,
                301
            )
        }

        const messageBody: WorldMessage = JSON.parse(message.document).body
        let content = messageBody.body
        
        let profileURL = `https://${entity.domain}/api/v1/profile/${entity.ccid}/world.concrnt.p`
        if (messageBody?.profileOverride?.profileID) {
            profileURL = `https://${entity.domain}/api/v1/profile/${messageBody.profileOverride.profileID}`
        }

        const profile: CoreProfile = await fetch(profileURL)
            .then((response) => response.json<ApiResponse<CoreProfile>>())
            .then((data) => data.content)
        if (!profile) {
            return Response.redirect(
                CCWORLD,
                301
            )
        }

        const worldProfile: WorldProfile = JSON.parse(profile.document).body

        const username = sanitizeHtml(worldProfile.username)
        const avatar = sanitizeHtml(worldProfile.avatar)

        const imageRegex = /!\[[^\]]*\]\(([^\)]*)\)/g

        const matches = content.matchAll(imageRegex)
        const images = Array.from(matches, m => m[1])

        let filteredMedias = 0
        const medias = messageBody.medias
        medias?.forEach((media) => {
            if (media.mediaType.startsWith('image')) {
                if (media.flag) filteredMedias++
                else images.push(media.mediaURL)
            }
        })

        if (filteredMedias > 0) {
            content += `(with ${filteredMedias} hidden images)`
        }

        // remove markdown image syntax
        content = content.replace(imageRegex, '')

        const responseBody = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta property="og:title" content="${username} on Concrnt">
    <meta property="og:description" content="${content}">
    <meta property="twitter:card" content="${images.length > 0 ? 'summary_large_image' : 'summary'}">
    ${
        images.length > 0 
            ? images.map((imageUrl) => `<meta property="og:image" content="${imageUrl}">`).join('\n')
            : `<meta property="og:image" content="${avatar}">`
    }
    <meta name="theme-color" content="#0476d9" />
    <script>
        window.location.href = "${originalPath}"
    </script>
  </head>
</html>
`

        response = new Response(responseBody, {
            headers: {
                'Content-Type': 'text/html',
                'Cache-Control': `s-maxage=${CACHE_TTL_SECONDS}`
            }
        })

        context.waitUntil(cache.put(cacheKey, response.clone()))
    }

    return response
}
