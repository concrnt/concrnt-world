import { Box, SxProps } from '@mui/material'
import { useGlobalState } from '../../context/GlobalState'
import { Blurhash } from 'react-blurhash'
import { useMediaViewer } from '../../context/MediaViewer'

export interface CCImageProps {
    src?: string
    blurhash?: string
    sx?: SxProps
    forceBlur?: boolean
}

export const CCImage = (props: CCImageProps): JSX.Element => {
    const { getImageURL } = useGlobalState()
    const mediaViewer = useMediaViewer()

    return (
        <Box
            sx={{
                borderRadius: 1,
                mx: 0.5,
                position: 'relative',
                overflow: 'hidden',
                userSelect: 'none',
                ...props.sx
            }}
            onClick={(e) => {
                mediaViewer.openSingle(props.src)
                e.stopPropagation()
            }}
        >
            {!props.forceBlur && (
                <img
                    src={getImageURL(props.src, { maxWidth: 512 })}
                    style={{
                        display: 'block',
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        cursor: 'pointer'
                    }}
                />
            )}
            <Box
                sx={{
                    borderRadius: 1,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#111',
                    zIndex: -1
                }}
            >
                {props.blurhash && (
                    <Blurhash
                        hash={props.blurhash}
                        height={'100%'}
                        width={'100%'}
                        punch={1}
                        resolutionX={32}
                        resolutionY={32}
                    />
                )}
            </Box>
        </Box>
    )
}
