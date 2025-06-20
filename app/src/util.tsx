import { useTranslation } from 'react-i18next'

import { Sign, type CCDocument } from '@concrnt/client'
import { encode } from 'blurhash'

export const string2Uint8Array = (str: string): Uint8Array => {
    const encoder = new TextEncoder()
    return encoder.encode(str)
}

export const convertToGoogleTranslateCode = (lang: string): string => {
    switch (lang) {
        case 'zh-Hans':
            return 'zh-CN'
        case 'zh-Hant':
            return 'zh-TW'
        default:
            return lang
    }
}

const loadImage = async (src: string): Promise<HTMLImageElement> =>
    await new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
            resolve(img)
        }
        img.onerror = (...args) => {
            reject(args)
        }
        img.src = src
    })

const getClampedSize = (width: number, height: number, max: number): { width: number; height: number } => {
    if (width >= height && width > max) {
        return { width: max, height: Math.round((height / width) * max) }
    }

    if (height > width && height > max) {
        return { width: Math.round((width / height) * max), height: max }
    }

    return { width, height }
}

const getImageData = (image: HTMLImageElement, resolutionX: number, resolutionY: number): ImageData | undefined => {
    const canvas = document.createElement('canvas')
    canvas.width = resolutionX
    canvas.height = resolutionY
    const context = canvas.getContext('2d')
    context?.drawImage(image, 0, 0, resolutionX, resolutionY)
    return context?.getImageData(0, 0, resolutionX, resolutionY)
}

export const genBlurHash = async (url: string): Promise<string | undefined> => {
    const img = await loadImage(url)
    const clampedSize = getClampedSize(img.width, img.height, 64)
    const data = getImageData(img, clampedSize.width, clampedSize.height)
    if (data) {
        return encode(data.data, clampedSize.width, clampedSize.height, 4, 4)
    }
}

export const jumpToDomainRegistration = (
    ccid: string,
    privateKey: string,
    fqdn: string,
    callback: string,
    ticket?: string
): void => {
    const affiliation: CCDocument.Affiliation = {
        signer: ccid,
        type: 'affiliation',
        domain: fqdn,
        signedAt: new Date()
    }

    const signedDoc = JSON.stringify(affiliation)
    const signature = Sign(privateKey, signedDoc)

    const encodedObject = btoa(signedDoc).replace('+', '-').replace('/', '_').replace('==', '')

    let link = `https://${fqdn}/web/register?registration=${encodedObject}&signature=${signature}&callback=${encodeURIComponent(
        callback
    )}`
    if (ticket) {
        link += `#${ticket}`
    }

    window.location.href = link
}

export const fetchWithTimeout = async (
    url: RequestInfo,
    init: RequestInit,
    timeoutMs = 15 * 1000
): Promise<Response> => {
    const controller = new AbortController()
    const clientTimeout = setTimeout(() => {
        controller.abort()
    }, timeoutMs)

    try {
        const reqConfig: RequestInit = { ...init, signal: controller.signal }
        const res = await fetch(url, reqConfig)
        if (!res.ok) {
            const description = `${res.status}: ${url as string} traceID: ${res.headers.get('trace-id') ?? 'N/A'}`
            return await Promise.reject(new Error(description))
        }

        return res
    } catch (e: unknown) {
        if (e instanceof Error) {
            return await Promise.reject(new Error(`${e.name}: ${e.message}`))
        } else {
            return await Promise.reject(new Error('fetch failed with unknown error'))
        }
    } finally {
        clearTimeout(clientTimeout)
    }
}

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

const nowEpsilon = 3000 // 3 seconds

export const humanReadableTimeDiff = (time: Date): string => {
    const current = new Date()
    const msPerMinute = 60 * 1000
    const msPerHour = msPerMinute * 60
    const msPerDay = msPerHour * 24

    const elapsed = current.getTime() - time.getTime()

    const { t } = useTranslation('', { keyPrefix: 'time' })

    if (Math.abs(elapsed) < nowEpsilon) {
        return t('now')
    }

    const postfix = t('separator') + (elapsed < 0 ? t('after') : t('before'))

    if (elapsed < msPerMinute) {
        return `${Math.round(Math.abs(elapsed) / 1000)}${t('seconds')}${postfix}`
    } else if (elapsed < msPerHour) {
        return `${Math.round(Math.abs(elapsed) / msPerMinute)}${t('minutes')}${postfix}`
    } else if (elapsed < msPerDay) {
        return `${Math.round(Math.abs(elapsed) / msPerHour)}${t('hours')}${postfix}`
    } else {
        return (
            (current.getFullYear() === time.getFullYear() ? '' : `${time.getFullYear()}-`) +
            `${String(time.getMonth() + 1).padStart(2, '0')}-` +
            `${String(time.getDate()).padStart(2, '0')} ` +
            `${String(time.getHours()).padStart(2, '0')}:` +
            `${String(time.getMinutes()).padStart(2, '0')}`
        )
    }
}

export const fileToBase64 = (file: File): Promise<string | null> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result)
            } else {
                resolve(null)
            }
        }
    })
}
