import { Box, Button, CircularProgress, IconButton, ImageList, ImageListItem, Modal } from '@mui/material'
import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { type ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'

import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import AppsIcon from '@mui/icons-material/Apps'
import { type WorldMedia } from '../model'
import { useGlobalState } from './GlobalState'
import { ModelViewer } from '../components/ModelViewer'
const zoomFactor = 8

const ExifInfo = lazy(() => import('../components/ExifInfo'))

export interface MediaViewerState {
    openSingle: (src?: string) => void
    openMedias: (medias: WorldMedia[], startIndex?: number) => void
    openModel: (src?: string) => void
}

const MediaViewerContext = createContext<MediaViewerState>({
    openSingle: () => {},
    openMedias: () => {},
    openModel: () => {}
})

interface MediaViewerProviderProps {
    children: JSX.Element | JSX.Element[]
}

export const MediaViewerProvider = (props: MediaViewerProviderProps): JSX.Element => {
    const [previewImage, setPreviewImage] = useState<string | undefined>()
    const [previewIndex, setPreviewIndex] = useState<number>(0)
    const [medias, setMedias] = useState<WorldMedia[]>([])
    const [previewModel, setPreviewModel] = useState<string | undefined>()

    const [mode, setMode] = useState<'single' | 'gallery'>('single')

    const { isMobileSize, getImageURL } = useGlobalState()

    const openSingle = (src?: string): void => {
        setMode('single')
        setPreviewImage(src)
    }

    const openMedias = (medias: WorldMedia[], startIndex?: number): void => {
        setMode('single')
        setMedias(medias)
        setPreviewIndex(startIndex ?? 0)
        setPreviewImage(medias[startIndex ?? 0].mediaURL)
    }

    const openModel = (src?: string): void => {
        setMode('single')
        setPreviewModel(src)
    }

    const padding = isMobileSize ? 20 : 100

    const [container, setContainer] = useState<HTMLDivElement | null>(null)

    const [containerWidth, setContainerWidth] = useState<number>(0)
    const [containerHeight, setContainerHeight] = useState<number>(0)

    const [imageNaturalWidth, setImageNaturalWidth] = useState<number>(0)
    const [imageNaturalHeight, setImageNaturalHeight] = useState<number>(0)
    const transformComponentRef = useRef<ReactZoomPanPinchRef | null>(null)
    const imageRef = useRef<HTMLImageElement | null>(null)

    const imageScale = useMemo(() => {
        if (containerWidth === 0 || containerHeight === 0 || imageNaturalWidth === 0 || imageNaturalHeight === 0)
            return 0
        return Math.min(
            (containerWidth - padding) / imageNaturalWidth,
            (containerHeight - padding) / imageNaturalHeight
        )
    }, [containerWidth, containerHeight, imageNaturalWidth, imageNaturalHeight])

    const centerPosition = useMemo(() => {
        if (containerWidth === 0 || containerHeight === 0 || imageNaturalWidth === 0 || imageNaturalHeight === 0)
            return { x: 0, y: 0 }
        const x = (containerWidth - imageNaturalWidth * imageScale) / 2
        const y = (containerHeight - imageNaturalHeight * imageScale) / 2
        return { x, y }
    }, [containerWidth, containerHeight, imageNaturalWidth, imageNaturalHeight, imageScale])

    const handleResize = useCallback(() => {
        if (container !== null) {
            const rect = container.getBoundingClientRect()
            setContainerWidth(rect.width)
            setContainerHeight(rect.height)
        } else {
            setContainerWidth(0)
            setContainerHeight(0)
        }
    }, [container])

    useEffect(() => {
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [handleResize])

    useEffect(() => {
        if (previewImage === undefined) {
            setImageNaturalWidth(0)
            setImageNaturalHeight(0)
            return
        }

        const image = new Image()
        image.src = getImageURL(previewImage)
        image.onload = () => {
            setImageNaturalWidth(image.naturalWidth)
            setImageNaturalHeight(image.naturalHeight)
        }
    }, [previewImage])

    const close = (): void => {
        setPreviewImage(undefined)
        setMedias([])
        setPreviewModel(undefined)
    }

    return (
        <MediaViewerContext.Provider value={useMemo(() => ({ openSingle, openMedias, openModel }), [])}>
            {props.children}
            <Modal
                open={!!previewImage || !!previewModel}
                onClose={close}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    position: 'absolute'
                }}
            >
                {mode === 'single' ? (
                    <>
                        {previewImage && (
                            <>
                                <Box
                                    flex={1}
                                    position="absolute"
                                    width="100vw"
                                    height="100dvh"
                                    top={0}
                                    left={0}
                                    ref={(el: HTMLDivElement | null) => {
                                        setContainer(el)
                                    }}
                                    onClick={(e) => {
                                        if (e.target !== imageRef.current) {
                                            close()
                                        }
                                    }}
                                    display="flex"
                                    justifyContent="center"
                                    alignItems="center"
                                >
                                    {imageScale > 0 ? (
                                        <TransformWrapper
                                            initialScale={imageScale}
                                            initialPositionX={centerPosition.x}
                                            initialPositionY={centerPosition.y}
                                            minScale={imageScale}
                                            maxScale={imageScale * zoomFactor}
                                            ref={transformComponentRef}
                                        >
                                            <TransformComponent
                                                wrapperStyle={{
                                                    width: '100%',
                                                    height: '100%'
                                                }}
                                            >
                                                <img
                                                    src={getImageURL(previewImage)}
                                                    style={{
                                                        pointerEvents: 'auto'
                                                    }}
                                                    alt="preview"
                                                    ref={(el: HTMLImageElement | null) => {
                                                        imageRef.current = el
                                                    }}
                                                />
                                            </TransformComponent>
                                        </TransformWrapper>
                                    ) : (
                                        <CircularProgress
                                            sx={{
                                                color: 'white'
                                            }}
                                        />
                                    )}
                                </Box>

                                {medias.length > 1 && (
                                    <IconButton
                                        disabled={previewIndex === 0}
                                        onClick={() => {
                                            setPreviewIndex(previewIndex - 1)
                                            setPreviewImage(medias[previewIndex - 1].mediaURL)
                                        }}
                                        sx={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '4px',
                                            transform: 'translateY(-50%)',
                                            zIndex: 1,
                                            backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                            '&:hover': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.5)'
                                            }
                                        }}
                                    >
                                        <KeyboardArrowLeftIcon />
                                    </IconButton>
                                )}

                                {medias.length > 1 && (
                                    <IconButton
                                        disabled={previewIndex === medias.length - 1}
                                        onClick={() => {
                                            setPreviewIndex(previewIndex + 1)
                                            setPreviewImage(medias[previewIndex + 1].mediaURL)
                                        }}
                                        sx={{
                                            position: 'absolute',
                                            top: '50%',
                                            right: '4px',
                                            transform: 'translateY(-50%)',
                                            zIndex: 1,
                                            backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                            '&:hover': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.5)'
                                            }
                                        }}
                                    >
                                        <KeyboardArrowRightIcon />
                                    </IconButton>
                                )}
                                {medias.length > 1 && (
                                    <IconButton
                                        onClick={() => {
                                            setMode('gallery')
                                        }}
                                        sx={{
                                            position: 'absolute',
                                            top: '3%',
                                            right: '3%',
                                            backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                            '&:hover': {
                                                backgroundColor: 'rgba(255, 255, 255, 5)'
                                            }
                                        }}
                                    >
                                        <AppsIcon />
                                    </IconButton>
                                )}
                            </>
                        )}

                        {previewModel && (
                            <ModelViewer
                                src={previewModel}
                                style={{
                                    backgroundColor: '#3f3f3f',
                                    width: '90vw',
                                    height: '90vh'
                                }}
                            />
                        )}

                        <Box
                            width="100%"
                            display="flex"
                            flexDirection="column"
                            p={1}
                            position="absolute"
                            bottom={'env(safe-area-inset-bottom)'}
                            gap={1}
                        >
                            <Box display="flex" justifyContent="right" alignItems="center">
                                <Suspense fallback={<CircularProgress />}>
                                    <ExifInfo
                                        src={getImageURL(previewImage)}
                                        keys={[
                                            'Model',
                                            'Lens',
                                            'FocalLength',
                                            'ExposureTime',
                                            'FNumber',
                                            'ISOSpeedRatings'
                                        ]}
                                    />
                                </Suspense>
                            </Box>

                            <Box display="flex" justifyContent="center" alignItems="center" flexDirection="row">
                                <Button onClick={close}>Close</Button>
                            </Box>
                        </Box>
                    </>
                ) : (
                    <>
                        <ImageList
                            variant="masonry"
                            cols={3}
                            rowHeight={164}
                            sx={{
                                maxWidth: '90vw'
                            }}
                        >
                            {medias.map((media, index) => (
                                <ImageListItem
                                    key={index}
                                    cols={index === 0 ? 2 : 1}
                                    onClick={() => {
                                        setPreviewIndex(index)
                                        setPreviewImage(media.mediaURL)
                                        setMode('single')
                                    }}
                                >
                                    <img
                                        src={getImageURL(media.thumbnailURL ?? media.mediaURL)}
                                        alt={media.mediaType}
                                        onClick={() => {
                                            setPreviewIndex(index)
                                            setPreviewImage(media.mediaURL)
                                        }}
                                    />
                                </ImageListItem>
                            ))}
                        </ImageList>
                        <Box
                            width="100%"
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            flexDirection="row"
                            p={1}
                            position="absolute"
                            bottom={'env(safe-area-inset-bottom)'}
                        >
                            <Button onClick={close}>Close</Button>
                        </Box>
                    </>
                )}
            </Modal>
        </MediaViewerContext.Provider>
    )
}

export const useMediaViewer = (): MediaViewerState => {
    return useContext(MediaViewerContext)
}
