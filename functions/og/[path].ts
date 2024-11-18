import type { ApiResponse, CoreEntity, CoreProfile, WorldProfile } from '../types/concurrent'
import { sanitizeHtml } from '../lib/sanitize'
import { CACHE_TTL_SECONDS, CCWORLD } from '../constants'

export const onRequest: PagesFunction = async (context) => {

    const url = new URL(context.request.url)
    const cacheKey = url.origin + url.pathname
    const originalPath = CCWORLD + url.pathname.replace('/og', '')

    // Cloudflare Workersの@CacheStorageタイプはcaches.defaultがあるが、ブラウザのCacheStorageはcaches.defaultがないのでエラーが出る
    // @ts-ignore
    const cache = caches.default

    let response = await cache.match(cacheKey)

    if (!response) {

        const { path } = context.params
        const ccid = path

        const entity: CoreEntity = await fetch(`https://ariake.concrnt.net/api/v1/entity/${ccid}`)
            .then((response) => response.json<ApiResponse<CoreEntity>>())
            .then((data) => data.content)
        if (!entity) {
            return Response.redirect(
                CCWORLD,
                301
            )
        }

        const profile: CoreProfile = await fetch(`https://${entity.domain}/api/v1/profile/${entity.ccid}/world.concrnt.p`)
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
        const description = sanitizeHtml(worldProfile.description)

        const responseBody = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta property="og:title" content="${username} on Concrnt">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${avatar}">
    <meta property="twitter:card" content="summary">
    <meta name="theme-color" content="#0476d9" />
    <link rel="canonical" href="${originalPath}">
    <script>
        window.location.href = "${originalPath}"
    </script>
  </head>
</html>`

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
