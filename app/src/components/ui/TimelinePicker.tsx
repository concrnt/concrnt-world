import {
    Autocomplete,
    Avatar,
    Box,
    InputAdornment,
    InputBase,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    type SxProps
} from '@mui/material'
import { ProfileSchema, type CommunityTimelineSchema, type Timeline } from '@concrnt/worldlib'
import { CCChip } from './CCChip'
import { useMemo, useState } from 'react'

import TagIcon from '@mui/icons-material/Tag'
import LockIcon from '@mui/icons-material/Lock'
import AddIcon from '@mui/icons-material/Add'
import CancelIcon from '@mui/icons-material/Cancel'
import { useGlobalState } from '../../context/GlobalState'
import { CCAvatar } from './CCAvatar'
import { useClient } from '../../context/ClientContext'
import { Profile } from '@concrnt/client'

export interface TimelinePickerProps {
    selected: Array<Timeline<CommunityTimelineSchema>>
    setSelected: (selected: Array<Timeline<CommunityTimelineSchema>>) => void
    sx?: SxProps
    options: Array<Timeline<CommunityTimelineSchema>>
    onlyCommunities?: boolean
    placeholder?: string
    postHome?: boolean
    setPostHome?: (postHome: boolean) => void
    selectedSubprofile?: Profile<ProfileSchema>
    setSelectedSubprofile?: (selectedSubprofile: Profile<ProfileSchema> | undefined) => void
}

export const TimelinePicker = (props: TimelinePickerProps): JSX.Element => {
    const communities = useMemo(() => {
        return props.options.filter((e) => e.schema === 'https://schema.concrnt.world/t/community.json')
    }, [props.options])

    const { client } = useClient()
    const { allProfiles } = useGlobalState()
    const [focused, setFocused] = useState(false)
    const [profileSelectAnchorEl, setProfileSelectAnchorEl] = useState<null | HTMLElement>(null)

    const userIcon = props.selectedSubprofile?.parsedDoc.body.avatar ?? client?.user?.profile?.avatar
    const userName = props.selectedSubprofile?.parsedDoc.body.username ?? client?.user?.profile?.username ?? 'Home'

    return (
        <Box
            sx={{
                ...props.sx,
                borderRadius: 2,
                flex: '1',
                backgroundColor: 'background.paper'
            }}
        >
            <Autocomplete
                filterSelectedOptions
                disableClearable
                sx={{ width: 1 }}
                multiple
                value={props.selected}
                options={communities}
                getOptionKey={(option: Timeline<CommunityTimelineSchema>) => option.id ?? ''}
                getOptionLabel={(option: Timeline<CommunityTimelineSchema>) => option.document.body.name}
                filterOptions={(options: Array<Timeline<CommunityTimelineSchema>>, state) => {
                    const filtered = options.filter((option) => {
                        if (props.selected.some((e) => e.id === option.id)) {
                            return false
                        }

                        if (state.inputValue === '') {
                            return true
                        }

                        if (!option.document.body.name) {
                            return false
                        }

                        return (
                            option.document.body.name.toLowerCase().includes(state.inputValue.toLowerCase()) ||
                            option.document.body.shortname?.toLowerCase().includes(state.inputValue.toLowerCase())
                        )
                    })
                    return filtered
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(_, value) => {
                    props.setSelected(value)
                }}
                forcePopupIcon={false}
                renderInput={(params) => {
                    const { InputLabelProps, InputProps, ...rest } = params

                    InputProps.startAdornment = (
                        <>
                            {!props.onlyCommunities && (
                                <CCChip
                                    size="small"
                                    variant={props.postHome ? 'filled' : 'outlined'}
                                    label={userName}
                                    sx={{
                                        color: props.postHome ? 'text.primary' : 'text.disabled',
                                        borderStyle: props.postHome ? 'solid' : 'dashed',
                                        textDecoration: props.postHome ? 'none' : 'line-through'
                                    }}
                                    icon={
                                        <CCAvatar
                                            circle
                                            identiconSource={props.selectedSubprofile?.id ?? client?.ccid}
                                            avatarURL={userIcon}
                                            sx={{ width: 20, height: 20 }}
                                        />
                                    }
                                    onClick={(e) => setProfileSelectAnchorEl(e.currentTarget)}
                                    onDelete={() => props.setPostHome?.(!props.postHome)}
                                    deleteIcon={
                                        <CancelIcon
                                            sx={{
                                                transform: props.postHome ? 'rotate(0deg)' : 'rotate(45deg)',
                                                transition: 'transform 0.2s'
                                            }}
                                        />
                                    }
                                />
                            )}
                            {InputProps.startAdornment}
                            {!focused && (
                                <InputAdornment position="start" disablePointerEvents sx={{}}>
                                    <CCChip
                                        variant="outlined"
                                        size="small"
                                        label={props.placeholder || 'Select timeline'}
                                        sx={{
                                            color: 'text.disabled',
                                            borderStyle: 'dashed',
                                            ml: 0.5
                                        }}
                                        deleteIcon={<AddIcon />}
                                        onDelete={() => {}}
                                    />
                                </InputAdornment>
                            )}
                        </>
                    )

                    return (
                        <InputBase
                            {...InputProps}
                            {...rest}
                            sx={{ color: 'props.theme.palette.text.secondary' }}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                        />
                    )
                }}
                renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                        <CCChip
                            size="small"
                            icon={option.policy.isReadPublic() ? <TagIcon /> : <LockIcon />}
                            label={option.document.body.name}
                            sx={{ color: 'text.default' }}
                            {...getTagProps({ index })}
                            key={option.id}
                        />
                    ))
                }
                renderOption={(props, option, _state, _ownerState) => (
                    <Box
                        component="li"
                        sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 0.5
                        }}
                        {...props}
                    >
                        {option.policy.isReadPublic() ? <TagIcon /> : <LockIcon />}
                        {option.document.body.name}
                    </Box>
                )}
            />
            <Menu
                anchorEl={profileSelectAnchorEl}
                open={Boolean(profileSelectAnchorEl)}
                onClose={() => {
                    setProfileSelectAnchorEl(null)
                }}
            >
                <List disablePadding>
                    {props.selectedSubprofile && (
                        <ListItemButton
                            onClick={() => {
                                props.setSelectedSubprofile?.(undefined)
                                setProfileSelectAnchorEl(null)
                            }}
                        >
                            <ListItemIcon>
                                <CCAvatar
                                    alt={client?.user?.profile?.username ?? 'Unknown'}
                                    avatarURL={client?.user?.profile?.avatar}
                                    identiconSource={client?.ccid ?? ''}
                                />
                            </ListItemIcon>
                            <ListItemText>{client.user?.profile?.username}</ListItemText>
                        </ListItemButton>
                    )}

                    {allProfiles.map((p) => {
                        if (props.selectedSubprofile?.id === p.id) return undefined
                        return (
                            <ListItemButton
                                key={p.id}
                                onClick={() => {
                                    props.setSelectedSubprofile?.(p)
                                    setProfileSelectAnchorEl(null)
                                }}
                            >
                                <ListItemIcon>
                                    <Avatar
                                        alt={p.parsedDoc.body.username}
                                        src={p.parsedDoc.body.avatar}
                                        variant="square"
                                    />
                                </ListItemIcon>
                                <ListItemText>{p.parsedDoc.body.username}</ListItemText>
                            </ListItemButton>
                        )
                    })}
                </List>
            </Menu>
        </Box>
    )
}
