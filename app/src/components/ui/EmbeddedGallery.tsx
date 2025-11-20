import { Box, IconButton, Typography } from '@mui/material'
import { useMediaViewer } from '../../context/MediaViewer'
import { VList, type VListHandle } from 'virtua'
import { useEffect, useRef, useState } from 'react'

import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { type WorldMedia } from '../../model'
import { Blurhash } from 'react-blurhash'
import { useGlobalState } from '../../context/GlobalState'
import FullscreenIcon from '@mui/icons-material/Fullscreen'

import poster from '../../resources/view-3dmodel.png'

import { CCIconButton } from './CCIconButton'
import { useTranslation } from 'react-i18next'
import { ModelViewer } from '../ModelViewer'

export interface EmbeddedGalleryProps {
    medias: WorldMedia[]
}

export const MediaCard = ({ media, onExpand }: { media: WorldMedia; onExpand?: () => void }): JSX.Element => {
    const [_, setForceUpdate] = useState(0)
    const imageRef = useRef<HTMLImageElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)

    const mediaViewer = useMediaViewer()

    const { getImageURL } = useGlobalState()

    const setAllowedUrl = (url: string): void => {
        const key = 'reveal:' + url
        sessionStorage.setItem(key, 'true')
        setForceUpdate((prev) => prev + 1)
    }

    const resetAllowedUrls = (url: string): void => {
        const key = 'reveal:' + url
        sessionStorage.removeItem(key)
        setForceUpdate((prev) => prev + 1)
    }

    const checkUrlAllowed = (url: string): boolean => {
        const key = 'reveal:' + url
        return sessionStorage.getItem(key) === 'true'
    }

    const isHidden = media.flag && !checkUrlAllowed(media.mediaURL)

    const [showModel, setShowModel] = useState(false)

    const { t } = useTranslation('', { keyPrefix: 'ui.draft' })

    const flagMap: Record<string, string> = {
        warn: t('flag-warn'),
        nude: t('flag-nude'),
        porn: t('flag-porn'),
        hard: t('flag-hard')
    }

    const flag = media.flag ? (flagMap[media.flag] ?? media.flag) : undefined

    return (
        <Box
            sx={{
                height: '15vh',
                aspectRatio: '4/3',
                borderRadius: 1,
                mx: 0.5,
                position: 'relative',
                overflow: 'hidden',
                userSelect: 'none'
            }}
            onClick={(e) => {
                e.stopPropagation()
                if (isHidden) setAllowedUrl(media.mediaURL)
                else onExpand?.()
            }}
        >
            {!isHidden ? (
                <>
                    {media.mediaType.startsWith('image') && (
                        <Box
                            itemScope
                            itemProp="image"
                            itemType="https://schema.org/ImageObject"
                            sx={{
                                position: 'relative',
                                width: '100%',
                                height: '100%',
                                overflow: 'hidden'
                            }}
                        >
                            <img
                                src={getImageURL(media.mediaURL, { maxWidth: 512 })}
                                ref={imageRef}
                                style={{
                                    display: isHidden ? 'none' : 'block',
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    cursor: 'pointer'
                                }}
                            />
                            <meta itemProp="contentUrl" content={media.mediaURL} />
                            <meta itemProp="caption" content={flag} />
                        </Box>
                    )}

                    {media.mediaType.startsWith('audio') && (
                        <Box
                            sx={{
                                position: 'relative',
                                width: '100%',
                                height: '100%',
                                overflow: 'hidden'
                            }}
                        >
                            <audio
                                controls
                                src={media.mediaURL}
                                preload="metadata"
                                style={{
                                    width: '100%',
                                    height: '100%'
                                }}
                            />
                        </Box>
                    )}

                    {media.mediaType.startsWith('video') && (
                        <Box
                            ref={videoRef}
                            component="video"
                            muted
                            controls
                            src={media.mediaURL + (media.mediaURL.includes('#') ? '' : '#t=0.1')}
                            preload="metadata"
                            style={{
                                display: isHidden ? 'none' : 'block',
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                cursor: 'pointer'
                            }}
                            onClick={(e) => {
                                e.stopPropagation()
                            }}
                            itemScope
                            itemProp="video"
                            itemType="https://schema.org/VideoObject"
                        >
                            <meta itemProp="contentUrl" content={media.mediaURL} />
                            <meta itemProp="caption" content={flag} />
                        </Box>
                    )}

                    {media.mediaType.startsWith('model') && (
                        <Box
                            onClick={(e) => {
                                e.stopPropagation()
                            }}
                            sx={{
                                backgroundCorlor: '#eee',
                                height: '100%',
                                position: 'relative'
                            }}
                        >
                            {showModel ? (
                                <ModelViewer
                                    src={media.mediaURL}
                                    style={{
                                        backgroundColor: '#3f3f3f',
                                        width: '100%',
                                        height: '100%'
                                    }}
                                />
                            ) : (
                                <Box
                                    component="img"
                                    src={poster}
                                    sx={{
                                        width: '100%',
                                        height: '100%',
                                        cursor: 'pointer',
                                        objectFit: 'contain'
                                    }}
                                    onClick={() => {
                                        setShowModel(true)
                                    }}
                                />
                            )}

                            <CCIconButton
                                sx={{
                                    position: 'absolute',
                                    bottom: 5,
                                    right: 5,
                                    backgroundColor: 'rgba(255, 255, 255, 0.5)'
                                }}
                                onClick={() => {
                                    mediaViewer.openModel(media.mediaURL)
                                }}
                            >
                                <FullscreenIcon />
                            </CCIconButton>
                        </Box>
                    )}

                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#111',
                            zIndex: -1
                        }}
                    >
                        {media.blurhash && (
                            <Blurhash
                                hash={media.blurhash}
                                height={'100%'}
                                width={'100%'}
                                punch={1}
                                resolutionX={32}
                                resolutionY={32}
                            />
                        )}
                    </Box>

                    {media.flag && (
                        <VisibilityOffIcon
                            sx={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                color: 'rgba(255, 255, 255, 0.5)'
                            }}
                            onClick={(e) => {
                                e.stopPropagation()
                                resetAllowedUrls(media.mediaURL)
                            }}
                        />
                    )}
                </>
            ) : (
                <>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#111'
                        }}
                    >
                        {media.blurhash && (
                            <Blurhash
                                hash={media.blurhash}
                                height={'100%'}
                                width={'100%'}
                                punch={1}
                                resolutionX={32}
                                resolutionY={32}
                            />
                        )}
                    </Box>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: 'rgba(255, 255, 255, 0.5)',
                            textAlign: 'center'
                        }}
                    >
                        <Typography variant="h3">{flag}</Typography>
                        <Typography variant="caption">Click to reveal</Typography>
                    </Box>
                </>
            )}
        </Box>
    )
}

export const EmbeddedGallery = (props: EmbeddedGalleryProps): JSX.Element => {
    const listRef = useRef<VListHandle>(null)
    const mediaViewer = useMediaViewer()

    const [range, setRange] = useState({ start: 0, end: 0 })
    const [overflowed, setOverflowed] = useState(false)

    useEffect(() => {
        const isOverFlow = range.start !== 0 || range.end !== props.medias.length - 1
        if (isOverFlow) setOverflowed(true)
    }, [range, props.medias])

    return (
        <Box position="relative">
            <VList
                horizontal
                style={{
                    height: '15vh',
                    overflowY: 'hidden'
                }}
                ref={listRef}
                onRangeChange={(start, end) => {
                    setRange({ start, end })
                }}
            >
                {props.medias.map((media, index) => {
                    return (
                        <MediaCard
                            key={index}
                            media={media}
                            onExpand={() => {
                                mediaViewer.openMedias(props.medias, index)
                            }}
                        />
                    )
                })}
            </VList>
            {overflowed && (
                <>
                    <IconButton
                        onClick={(e) => {
                            e.stopPropagation()
                            listRef.current?.scrollToIndex(range.start, {
                                align: 'center',
                                smooth: true
                            })
                        }}
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: 0,
                            transform: 'translateY(-50%)',
                            zIndex: 1,
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.3)'
                            }
                        }}
                    >
                        <KeyboardArrowLeftIcon />
                    </IconButton>
                    <IconButton
                        onClick={(e) => {
                            e.stopPropagation()
                            listRef.current?.scrollToIndex(range.end, {
                                align: 'center',
                                smooth: true
                            })
                        }}
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            right: 0,
                            transform: 'translateY(-50%)',
                            zIndex: 1,
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.3)'
                            }
                        }}
                    >
                        <KeyboardArrowRightIcon />
                    </IconButton>
                </>
            )}
        </Box>
    )
}
