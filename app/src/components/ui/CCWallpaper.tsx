import { Box, Skeleton, type SxProps } from '@mui/material'
import Wallpaper from '../../resources/cc-wallpaper-base.png'
import { useGlobalState } from '../../context/GlobalState'

export interface CCWallpaperProps {
    sx?: SxProps
    innerSx?: SxProps
    override?: string
    children?: JSX.Element | JSX.Element[]
    isLoading?: boolean
}

export const CCWallpaper = (props: CCWallpaperProps): JSX.Element => {
    const { getImageURL } = useGlobalState()

    return (
        <Box
            sx={{
                backgroundColor: props.isLoading ? 'unset' : 'primary.main',
                position: 'relative',
                ...props.sx
            }}
        >
            {props.isLoading ? (
                <Skeleton
                    variant="rectangular"
                    sx={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%'
                    }}
                />
            ) : (
                <Box
                    sx={{
                        position: 'absolute',
                        backgroundImage: `url(${getImageURL(props.override) || Wallpaper})`,
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
                        mixBlendMode: props.override ? 'normal' : 'hard-light',
                        width: '100%',
                        height: '100%'
                    }}
                ></Box>
            )}
            <Box
                sx={{
                    position: 'relative',
                    zIndex: 1,
                    width: '100%',
                    height: '100%',
                    ...props.innerSx
                }}
            >
                {props.children}
            </Box>
        </Box>
    )
}
