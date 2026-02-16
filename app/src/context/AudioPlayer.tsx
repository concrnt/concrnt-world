import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import CloseIcon from '@mui/icons-material/Close'
import VolumeOffIcon from '@mui/icons-material/VolumeOff'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import { Box, IconButton, Paper, Slider, Typography } from '@mui/material'
import { parseWebStream } from 'music-metadata'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePersistent } from '../hooks/usePersistent'

export interface AudioPlayerState {
    nowPlaying: string | null
    play(src: string): void
    stop(): void
}

const AudioPlayerContext = createContext<AudioPlayerState>({
    nowPlaying: null,
    play: () => {},
    stop: () => {}
})

interface AudioPlayerProviderProps {
    children: JSX.Element | JSX.Element[]
}

const clampVolume = (value: number): number => Math.max(0, Math.min(1, value))

const formatTimeLabel = (seconds: number): string => {
    const safe = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0
    const hour = Math.floor(safe / 3600)
    const minute = Math.floor((safe % 3600) / 60)
    const second = safe % 60

    if (hour > 0) {
        return `${hour}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
    }
    return `${minute}:${String(second).padStart(2, '0')}`
}

interface TrackMetadata {
    title: string | null
    composer: string | null
    artwork: { data: Uint8Array; format?: string } | null
}

const readTrackMetadataFromTag = async (input: string): Promise<TrackMetadata> => {
    try {
        const response = await fetch(input)
        if (!response.ok || !response.body) return { title: null, composer: null, artwork: null }

        const contentLength = response.headers.get('Content-Length')
        const metadata = await parseWebStream(
            response.body,
            {
                mimeType: response.headers.get('Content-Type') ?? undefined,
                size: contentLength ? Number(contentLength) : undefined
            },
            {
                duration: false,
                skipCovers: false,
                skipPostHeaders: true
            }
        )

        const title = metadata.common.title?.trim()
        const composer = metadata.common.composer?.join(', ')?.trim()
        const picture = metadata.common.picture?.[0]

        return {
            title: title && title.length > 0 ? title : null,
            composer: composer && composer.length > 0 ? composer : null,
            artwork: picture ? { data: picture.data, format: picture.format } : null
        }
    } catch {
        return { title: null, composer: null, artwork: null }
    }
}

export const AudioPlayerProvider = (props: AudioPlayerProviderProps): JSX.Element => {
    const audioRef = useRef<HTMLAudioElement>(null)
    const progressTimerRef = useRef<number | null>(null)
    const artworkObjectUrlRef = useRef<string | null>(null)
    const [src, setSrc] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [duration, setDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [seekingTime, setSeekingTime] = useState<number | null>(null)
    const [volumePanelOpen, setVolumePanelOpen] = useState(false)
    const [volume, setVolume] = usePersistent<number>('AudioPlayerVolume', 0.8)
    const [trackTitle, setTrackTitle] = useState<string | null>(null)
    const [trackComposer, setTrackComposer] = useState<string | null>(null)
    const [artworkUrl, setArtworkUrl] = useState<string | null>(null)

    const play = useCallback(
        (nextSrc: string) => {
            if (!nextSrc) return

            if (audioRef.current && src === nextSrc) {
                audioRef.current.currentTime = 0
                void audioRef.current.play()
                setIsPlaying(true)
                return
            }

            setSrc(nextSrc)
            setCurrentTime(0)
            setDuration(0)
        },
        [src]
    )

    const togglePlay = useCallback(() => {
        if (!audioRef.current) return

        if (isPlaying) {
            audioRef.current.pause()
            setIsPlaying(false)
            return
        }

        void audioRef.current.play()
        setIsPlaying(true)
    }, [isPlaying])

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.removeAttribute('src')
            audioRef.current.load()
        }
        setSrc(null)
        setIsPlaying(false)
        setCurrentTime(0)
        setDuration(0)
        setSeekingTime(null)
        setVolumePanelOpen(false)
    }, [])

    useEffect(() => {
        const player = audioRef.current
        if (!player || !src) return

        player.src = src
        player.currentTime = 0
        player.volume = clampVolume(volume)

        void player
            .play()
            .then(() => {
                setIsPlaying(true)
            })
            .catch(() => {
                setIsPlaying(false)
            })
    }, [src])

    useEffect(() => {
        if (!audioRef.current) return
        audioRef.current.volume = clampVolume(volume)
    }, [volume])

    useEffect(() => {
        if (!src) {
            setTrackTitle(null)
            setTrackComposer(null)
            setArtworkUrl(null)
            if (artworkObjectUrlRef.current) {
                URL.revokeObjectURL(artworkObjectUrlRef.current)
                artworkObjectUrlRef.current = null
            }
            return
        }

        setTrackTitle(null)
        setTrackComposer(null)
        setArtworkUrl(null)
        if (artworkObjectUrlRef.current) {
            URL.revokeObjectURL(artworkObjectUrlRef.current)
            artworkObjectUrlRef.current = null
        }
        let active = true
        void readTrackMetadataFromTag(src).then((metadata) => {
            if (!active) return
            setTrackTitle(metadata.title)
            setTrackComposer(metadata.composer)
            if (metadata.artwork) {
                const artworkBlob = new Blob([metadata.artwork.data], { type: metadata.artwork.format || 'image/jpeg' })
                const objectUrl = URL.createObjectURL(artworkBlob)
                artworkObjectUrlRef.current = objectUrl
                setArtworkUrl(objectUrl)
            }
        })

        return () => {
            active = false
        }
    }, [src])

    useEffect(() => {
        return () => {
            if (artworkObjectUrlRef.current) {
                URL.revokeObjectURL(artworkObjectUrlRef.current)
                artworkObjectUrlRef.current = null
            }
        }
    }, [])

    useEffect(() => {
        if (!isPlaying || seekingTime !== null) return

        progressTimerRef.current = window.setInterval(() => {
            if (!audioRef.current) return
            setCurrentTime(audioRef.current.currentTime)
        }, 50)

        return () => {
            if (progressTimerRef.current !== null) {
                window.clearInterval(progressTimerRef.current)
                progressTimerRef.current = null
            }
        }
    }, [isPlaying, seekingTime])

    const seekValue = seekingTime ?? currentTime

    return (
        <AudioPlayerContext.Provider value={useMemo(() => ({ nowPlaying: src, play, stop }), [src, play, stop])}>
            {props.children}
            <audio
                ref={audioRef}
                preload="metadata"
                onPlay={() => {
                    setIsPlaying(true)
                }}
                onPause={() => {
                    setIsPlaying(false)
                }}
                onLoadedMetadata={(e) => {
                    const nextDuration = Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0
                    setDuration(nextDuration)
                }}
                onDurationChange={(e) => {
                    const nextDuration = Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0
                    setDuration(nextDuration)
                }}
                onTimeUpdate={(e) => {
                    if (seekingTime !== null) return
                    setCurrentTime(e.currentTarget.currentTime)
                }}
                onEnded={() => {
                    setIsPlaying(false)
                }}
            />
            {src && (
                <Paper
                    sx={{
                        height: '64px',
                        margin: { xs: 0.5, sm: 1 },
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        px: 1,
                        gap: 0.5,
                        position: 'relative'
                    }}
                >
                    <Box sx={{ width: 40, display: 'flex', justifyContent: 'center' }}>
                        <IconButton onClick={togglePlay} size="small">
                            {isPlaying ? (
                                <PauseIcon sx={{ color: 'text.primary' }} />
                            ) : (
                                <PlayArrowIcon sx={{ color: 'text.primary' }} />
                            )}
                        </IconButton>
                    </Box>

                    <Box
                        sx={{
                            px: 0.75,
                            display: 'flex',
                            alignItems: 'center',
                            minWidth: 0,
                            maxWidth: 260,
                            flexShrink: 1
                        }}
                    >
                        {(artworkUrl || trackTitle || trackComposer) && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                                {artworkUrl && (
                                    <Box
                                        component="img"
                                        src={artworkUrl}
                                        alt="album art"
                                        sx={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 0.75,
                                            objectFit: 'cover',
                                            flexShrink: 0
                                        }}
                                    />
                                )}
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            display: 'block',
                                            lineHeight: 1.2,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {trackTitle || ''}
                                    </Typography>
                                    {trackComposer && (
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                display: 'block',
                                                lineHeight: 1.1,
                                                fontSize: '0.68rem',
                                                opacity: 0.75,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {trackComposer}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        )}
                    </Box>

                    <Box sx={{ flex: 1, px: 0.5, display: 'flex', alignItems: 'center', minWidth: 0 }}>
                        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    minWidth: 36,
                                    textAlign: 'right',
                                    lineHeight: 1,
                                    fontVariantNumeric: 'tabular-nums'
                                }}
                            >
                                {formatTimeLabel(seekValue)}
                            </Typography>
                            <Slider
                                size="small"
                                min={0}
                                max={duration > 0 ? duration : 1}
                                value={Math.min(seekValue, duration > 0 ? duration : 1)}
                                sx={{ my: 0, flex: 1 }}
                                onChange={(_, value) => {
                                    const nextTime = Array.isArray(value) ? value[0] : value
                                    setSeekingTime(nextTime)
                                }}
                                onChangeCommitted={(_, value) => {
                                    if (!audioRef.current) return
                                    const nextTime = Array.isArray(value) ? value[0] : value
                                    audioRef.current.currentTime = nextTime
                                    setCurrentTime(nextTime)
                                    setSeekingTime(null)
                                }}
                            />
                            <Typography
                                variant="caption"
                                sx={{
                                    minWidth: 36,
                                    textAlign: 'left',
                                    lineHeight: 1,
                                    fontVariantNumeric: 'tabular-nums'
                                }}
                            >
                                {formatTimeLabel(duration)}
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                            sx={{
                                width: 40,
                                display: 'flex',
                                justifyContent: 'center',
                                position: 'relative'
                            }}
                            onMouseEnter={() => {
                                setVolumePanelOpen(true)
                            }}
                            onMouseLeave={() => {
                                setVolumePanelOpen(false)
                            }}
                        >
                            <IconButton
                                size="small"
                                onClick={() => {
                                    setVolumePanelOpen((prev) => !prev)
                                }}
                            >
                                {volume <= 0 ? (
                                    <VolumeOffIcon sx={{ color: 'text.primary' }} />
                                ) : (
                                    <VolumeUpIcon sx={{ color: 'text.primary' }} />
                                )}
                            </IconButton>
                            {volumePanelOpen && (
                                <Paper
                                    sx={{
                                        position: 'absolute',
                                        bottom: 'calc(100% + 8px)',
                                        right: 0,
                                        width: 40,
                                        height: 140,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        p: 1
                                    }}
                                >
                                    <Slider
                                        orientation="vertical"
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        value={clampVolume(volume)}
                                        onChange={(_, value) => {
                                            const nextVolume = Array.isArray(value) ? value[0] : value
                                            setVolume(clampVolume(nextVolume))
                                        }}
                                    />
                                </Paper>
                            )}
                        </Box>
                        <Box sx={{ width: 40, display: 'flex', justifyContent: 'center' }}>
                            <IconButton
                                size="small"
                                onClick={() => {
                                    stop()
                                }}
                            >
                                <CloseIcon sx={{ color: 'text.primary' }} />
                            </IconButton>
                        </Box>
                    </Box>
                </Paper>
            )}
        </AudioPlayerContext.Provider>
    )
}

export const useAudioPlayer = (): AudioPlayerState => {
    return useContext(AudioPlayerContext)
}
