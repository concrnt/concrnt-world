import { useState } from 'react'
import { useGlobalState } from '../context/GlobalState'
import { Avatar, ButtonBase, ListItemIcon, Menu, MenuItem, type SxProps } from '@mui/material'
import { CCAvatar } from './ui/CCAvatar'
import { useClient } from '../context/ClientContext'
import { SubprofileBadge } from './ui/SubprofileBadge'

interface SubprofileSelectorProps {
    selectedSubprofile: string | undefined
    setSelectedSubprofile: (id: string | undefined) => void
    sx?: SxProps
}

export const SubprofileSelector = (props: SubprofileSelectorProps): JSX.Element => {
    const { client } = useClient()
    const { allProfiles } = useGlobalState()
    const [profileSelectAnchorEl, setProfileSelectAnchorEl] = useState<null | HTMLElement>(null)

    return (
        <>
            <ButtonBase
                onClick={(e) => {
                    setProfileSelectAnchorEl(e.currentTarget)
                }}
            >
                {props.selectedSubprofile ? (
                    <SubprofileBadge characterID={props.selectedSubprofile} authorCCID={client.ccid!} sx={props.sx} />
                ) : (
                    <CCAvatar
                        alt={client.user?.profile?.username}
                        avatarURL={client.user?.profile?.avatar}
                        identiconSource={client.ccid}
                        sx={props.sx}
                    />
                )}
            </ButtonBase>
            <Menu
                anchorEl={profileSelectAnchorEl}
                open={Boolean(profileSelectAnchorEl)}
                onClose={() => {
                    setProfileSelectAnchorEl(null)
                }}
            >
                {props.selectedSubprofile && (
                    <MenuItem
                        onClick={() => {
                            props.setSelectedSubprofile(undefined)
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
                    if (props.selectedSubprofile === p.id) return undefined
                    return (
                        <MenuItem
                            key={p.id}
                            onClick={() => {
                                props.setSelectedSubprofile(p.id)
                            }}
                        >
                            <ListItemIcon>
                                <Avatar alt={p.document.body.username} src={p.document.body.avatar} variant="square" />
                            </ListItemIcon>
                        </MenuItem>
                    )
                })}
            </Menu>
        </>
    )
}
