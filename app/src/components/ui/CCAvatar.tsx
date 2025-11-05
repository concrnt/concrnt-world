import { Avatar, Skeleton, type SxProps } from '@mui/material'
import BoringAvatar from 'boring-avatars'
import { useGlobalState } from '../../context/GlobalState'

export interface CCAvatarProps {
    circle?: boolean
    sx?: SxProps
    alt?: string
    avatarURL?: string
    identiconSource?: string
    isLoading?: boolean
}

export const CCAvatar = (props: CCAvatarProps): JSX.Element => {
    const { getImageURL } = useGlobalState()

    if (props.isLoading) {
        return <Skeleton variant="rectangular" sx={props.sx} />
    }

    return (
        <Avatar
            alt={props.alt}
            src={getImageURL(props.avatarURL, { maxWidth: 256 })}
            sx={{
                ...props.sx,
                borderRadius: props.circle ? undefined : 1
            }}
            variant={props.circle ? 'circular' : 'square'}
        >
            <BoringAvatar
                square={!props.circle}
                name={props.identiconSource}
                variant="beam"
                size={1000}
                style={{
                    width: '100%',
                    height: '100%'
                }}
            />
        </Avatar>
    )
}
