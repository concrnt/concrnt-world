import { UserProfile, type User } from '@concrnt/worldlib'
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail'
import { useClient } from '../../context/ClientContext'
import { useEffect, useState } from 'react'
import { CCAvatar } from './CCAvatar'
import { CCChip } from './CCChip'

export interface CCUserChipProps {
    ccid?: string
    user?: User
    profile?: UserProfile

    iconOverride?: JSX.Element
    onDelete?: () => void
    avatar?: boolean
}

export const CCUserChip = (props: CCUserChipProps): JSX.Element => {
    const { client } = useClient()
    const [user, setUser] = useState<User | null | undefined>(props.user)

    useEffect(() => {
        if (props.user !== undefined || props.profile !== undefined || !props.ccid) return
        let unmounted = false
        client.getUser(props.ccid).then((user) => {
            if (unmounted) return
            setUser(user)
        })
        return () => {
            unmounted = true
        }
    }, [props.ccid])

    const icon = props.avatar ? (
        <CCAvatar
            sx={{
                width: 20,
                height: 20
            }}
            circle
            identiconSource={props.profile?.ccid ?? user?.ccid ?? ''}
            avatarURL={props.profile?.avatar ?? user?.profile?.avatar}
        />
    ) : (
        (props.iconOverride ?? <AlternateEmailIcon fontSize="small" />)
    )

    const username = props.profile?.username ?? user?.profile?.username ?? 'anonymous'

    return (
        <>
            {props.onDelete ? (
                <CCChip size={'small'} label={username} icon={icon} onDelete={props.onDelete} />
            ) : (
                <CCChip to={'/' + (user?.ccid ?? '')} size={'small'} label={username} icon={icon} />
            )}
        </>
    )
}
