import { type Dispatch, type SetStateAction, useCallback, useRef } from 'react'
import { useSnackbar } from 'notistack'
import { useStorage } from '../context/StorageContext'
import { genBlurHash } from '../util'
import { type DraftMedia } from './useDraftState'
import { type EditorMode } from '../components/Editor/CCPostEditor'

export interface UseMediaUploadParams {
    mode: EditorMode
    setMode: (mode: EditorMode) => void
    draft: string
    setDraft: Dispatch<SetStateAction<string>>
    setMedias: Dispatch<SetStateAction<DraftMedia[]>>
    autoSwitchMediaPostType: boolean
}

export interface MediaUploadActions {
    uploadMedia: (file: File) => Promise<void>
    handlePasteFile: (event: any) => Promise<void>
}

export function useMediaUpload(params: UseMediaUploadParams): MediaUploadActions {
    const { uploadFile } = useStorage()
    const { enqueueSnackbar } = useSnackbar()
    const paramsRef = useRef(params)
    paramsRef.current = params

    const uploadMedia = useCallback(
        async (file: File): Promise<void> => {
            const { draft, setDraft, setMode, setMedias, autoSwitchMediaPostType } = paramsRef.current
            let currentMode = paramsRef.current.mode
            let fileType = file.type

            if (!fileType) {
                if (file.name.endsWith('.glb')) {
                    fileType = 'model/gltf-binary'
                }
            }

            if (!fileType) {
                enqueueSnackbar('Invalid file type', { variant: 'error' })
                return
            }

            const mediaExists = draft.match(/!\[[^\]]*\]\([^)]*\)/g)
            if (!mediaExists && currentMode === 'markdown' && autoSwitchMediaPostType) {
                currentMode = 'media'
                setMode('media')
            }

            if (currentMode === 'media') {
                let url = URL.createObjectURL(file)
                let blurhash = ''

                if (fileType.startsWith('image')) {
                    try {
                        blurhash = (await genBlurHash(url)) ?? ''
                    } catch (e) {
                        console.error('Failed to generate blurhash:', e)
                    }
                } else if (fileType.startsWith('video')) {
                    const canvas = document.createElement('canvas')
                    const video = document.createElement('video')
                    video.src = url
                    video.muted = true
                    video.playsInline = true

                    await new Promise<void>((resolve) => {
                        let rendered = false
                        video.oncanplay = async () => {
                            if (rendered || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return
                            rendered = true
                            setTimeout(() => {
                                video.pause()
                                resolve()
                            }, 33)
                        }

                        setTimeout(() => {
                            if (rendered) return
                            rendered = true
                            resolve()
                        }, 3000)
                        video.play()
                    })

                    canvas.width = video.videoWidth
                    canvas.height = video.videoHeight
                    const ctx = canvas.getContext('2d')
                    if (!ctx) return
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                    const thumbnailURL = canvas.toDataURL('image/jpeg')
                    url = thumbnailURL
                    try {
                        blurhash = (await genBlurHash(thumbnailURL)) ?? ''
                    } catch (e) {
                        console.error('Failed to generate blurhash:', e)
                    }
                }

                setMedias((medias) => [
                    ...medias,
                    {
                        key: url,
                        progress: 0,
                        media: {
                            mediaURL: '',
                            mediaType: fileType,
                            blurhash
                        }
                    }
                ])

                await uploadFile(file, (progress) => {
                    setMedias((medias) => {
                        const newMedias = [...medias]
                        const index = newMedias.findIndex((media) => media.key === url)
                        if (index >= 0) {
                            newMedias[index] = {
                                ...newMedias[index],
                                progress
                            }
                        }
                        return newMedias
                    })
                })
                    .then((result) => {
                        setMedias((medias) => {
                            const newMedias = [...medias]
                            const index = newMedias.findIndex((media) => media.key === url)
                            if (index >= 0) {
                                newMedias[index] = {
                                    ...newMedias[index],
                                    progress: 1,
                                    media: {
                                        ...newMedias[index].media,
                                        mediaURL: result
                                    }
                                }
                            } else {
                                console.error('Failed to update media:', url)
                            }
                            return newMedias
                        })
                    })
                    .catch((e) => {
                        enqueueSnackbar(`Failed to upload media: ${e}`, { variant: 'error' })
                        setMedias((medias) => medias.filter((media) => media.key !== url))
                    })
            } else {
                const uploadingText = ' ![uploading...]()'
                setDraft((before) => before + uploadingText)
                const result = await uploadFile(file)
                if (!result) {
                    setDraft((before) => before.replace(uploadingText, '') + `\n![upload failed]()`)
                } else {
                    if (fileType.startsWith('video')) {
                        setDraft(
                            (before) =>
                                before.replace(uploadingText, '') +
                                `\n<video controls><source src="${result}#t=0.1"></video>`
                        )
                    } else {
                        setDraft((before) => before.replace(uploadingText, '') + `\n![image](${result})`)
                    }
                }
            }
        },
        [uploadFile, enqueueSnackbar]
    )

    const handlePasteFile = useCallback(
        async (event: any): Promise<void> => {
            if (!event.clipboardData) return
            for (const item of event.clipboardData.items) {
                const file = item.getAsFile()
                if (!file) continue
                await uploadMedia(file)
            }
        },
        [uploadMedia]
    )

    return { uploadMedia, handlePasteFile }
}
