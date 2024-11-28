import type { ApiResponse, CoreTimeline, WorldCommunityTimeline } from '../../types/concurrent'
import { sanitizeHtml } from '../../lib/sanitize'
import { CACHE_TTL_SECONDS, CCWORLD } from '../../constants'

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
        const [streamId, host] = (<string>path).split('@')

        const timeline: CoreTimeline = await fetch(`https://${host}/api/v1/timeline/${streamId}`)
            .then((response) => response.json<ApiResponse<CoreTimeline>>())
            .then((data) => data.content)

        const payload: WorldCommunityTimeline = JSON.parse(timeline.document).body

        const name = sanitizeHtml(payload.name)
        const description = sanitizeHtml(payload.description)
        const imageUrl = sanitizeHtml(payload.banner)

        const responseBody = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>${name} on Concrnt</title>
    <meta name="description" content="${description}">
    <meta property="og:title" content="${name} on Concrnt">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="twitter:card" content="summary_large_image">
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
