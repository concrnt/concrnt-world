import { Tooltip, Paper } from '@mui/material'
import { UserProfileCard } from '../UserProfileCard'
import { type User } from '@concurrent-world/client'
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail'
import { useClient } from '../../context/ClientContext'
import { useEffect, useState } from 'react'
import { CCAvatar } from './CCAvatar'
import { type ProfileOverride } from '@concurrent-world/client/dist/types/model/core'
import { CCChip } from './CCChip'

export interface CCUserChipProps {
    user?: User
    ccid?: string
    iconOverride?: JSX.Element
    onDelete?: () => void
    avatar?: boolean
    profileOverride?: ProfileOverride
}

export const CCUserChip = (props: CCUserChipProps): JSX.Element => {
    const { client } = useClient()
    const [user, setUser] = useState<User | null | undefined>(props.user)

    useEffect(() => {
        if (props.user !== undefined) return
        if (!props.ccid) return
        let unmounted = false
        client.getUser(props.ccid).then((user) => {
            if (unmounted) return
            setUser(user)
        })
        return () => {
            unmounted = true
        }
    }, [props.ccid])

    const icon = props.avatar
        ? (
              <CCAvatar
                  sx={{
                      width: 20,
                      height: 20
                  }}
                  circle
                  identiconSource={user?.ccid ?? ''}
                  avatarURL={user?.profile?.avatar}
              />
          ) ?? <AlternateEmailIcon fontSize="small" />
        : props.iconOverride ?? <AlternateEmailIcon fontSize="small" />

    return (
        <Tooltip
            enterDelay={500}
            enterNextDelay={500}
            leaveDelay={300}
            placement="top"
            components={{
                Tooltip: Paper
            }}
            componentsProps={{
                tooltip: {
                    sx: {
                        m: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        minWidth: '300px'
                    }
                }
            }}
            title={<UserProfileCard user={user ?? undefined} />}
        >
            {props.onDelete ? (
                <CCChip
                    size={'small'}
                    label={props.profileOverride?.username ?? user?.profile?.username ?? 'anonymous'}
                    icon={icon}
                    onDelete={props.onDelete}
                />
            ) : (
                <CCChip
                    to={'/' + (user?.ccid ?? '')}
                    size={'small'}
                    label={props.profileOverride?.username ?? user?.profile?.username ?? 'anonymous'}
                    icon={icon}
                />
            )}
        </Tooltip>
    )
}
