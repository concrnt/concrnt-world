import { useEffect, useState } from 'react'
import { useClient } from '../../context/ClientContext'
import { User } from '@concrnt/worldlib'
import { CCAvatar } from './CCAvatar'
import { Skeleton, SxProps } from '@mui/material'

export interface CCAvatarWithResolverProps {
    ccid: string
    sx?: SxProps
    circle?: boolean
}

export const CCAvatarWithResolver = (props: CCAvatarWithResolverProps): JSX.Element => {
    const { client } = useClient()

    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        client.getUser(props.ccid).then(setUser)
    }, [props.ccid])

    if (!user) {
        return <Skeleton variant="rectangular" sx={props.sx} />
    }

    return (
        <CCAvatar
            alt={user.profile?.username}
            avatarURL={user.profile?.avatar}
            identiconSource={props.ccid}
            sx={props.sx}
            circle={props.circle}
        />
    )
}
