import { useState } from 'react'
import { useClient } from '../../context/ClientContext'
import { Avatar, IconButton, ListItemIcon, Menu, MenuItem } from '@mui/material'
import { CCAvatar } from './CCAvatar'
import { useGlobalState } from '../../context/GlobalState'
import { type Profile } from '@concrnt/client'

export interface ProfilePickerProps {
    selected?: Profile<any>
    setSelected: (subprofile?: Profile<any>) => void
}

export const ProfilePicker = (props: ProfilePickerProps): JSX.Element => {
    const { client } = useClient()

    const { allProfiles } = useGlobalState()
    const [profileSelectAnchorEl, setProfileSelectAnchorEl] = useState<null | HTMLElement>(null)

    return (
        <>
            <IconButton
                sx={{
                    width: { xs: '38px', sm: '48px' },
                    height: { xs: '38px', sm: '48px' },
                    mt: { xs: '3px', sm: '5px' }
                }}
                onClick={(e) => {
                    setProfileSelectAnchorEl(e.currentTarget)
                }}
            >
                <CCAvatar
                    avatarURL={props.selected?.parsedDoc.body.avatar ?? client?.user?.profile?.avatar}
                    sx={{
                        width: { xs: '38px', sm: '48px' },
                        height: { xs: '38px', sm: '48px' }
                    }}
                />
            </IconButton>
            <Menu
                anchorEl={profileSelectAnchorEl}
                open={Boolean(profileSelectAnchorEl)}
                onClose={() => {
                    setProfileSelectAnchorEl(null)
                }}
            >
                {props.selected && (
                    <MenuItem
                        onClick={() => {
                            props.setSelected(undefined)
                        }}
                        selected
                    >
                        <ListItemIcon>
                            <CCAvatar
                                alt={client?.user?.profile?.username ?? 'Unknown'}
                                avatarURL={client?.user?.profile?.avatar}
                                identiconSource={client?.ccid ?? ''}
                            />
                        </ListItemIcon>
                    </MenuItem>
                )}

                {allProfiles.map((p) => {
                    if (props.selected?.id === p.id) return undefined
                    return (
                        <MenuItem
                            key={p.id}
                            onClick={() => {
                                props.setSelected(p)
                            }}
                        >
                            <ListItemIcon>
                                <Avatar
                                    alt={p.parsedDoc.body.username}
                                    src={p.parsedDoc.body.avatar}
                                    variant="square"
                                />
                            </ListItemIcon>
                        </MenuItem>
                    )
                })}
            </Menu>
        </>
    )
}
