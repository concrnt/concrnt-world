import { Autocomplete, Box, InputBase, ListItem, ListItemIcon, ListItemText, type SxProps } from '@mui/material'
import { type User } from '@concrnt/worldlib'
import { useClient } from '../../context/ClientContext'
import { CCUserChip } from './CCUserChip'
import { CCAvatar } from './CCAvatar'
import { useTranslation } from 'react-i18next'

export interface UserPickerProps {
    selected: User[]
    setSelected: (selected: User[]) => void
    sx?: SxProps
}

export const UserPicker = (props: UserPickerProps): JSX.Element => {
    const { client } = useClient()

    const { t } = useTranslation('', { keyPrefix: 'ui.userPicker' })

    return (
        <Box
            sx={{
                ...props.sx,
                borderRadius: 2,
                padding: '0px 10px',
                flex: '1',
                backgroundColor: 'background.paper'
            }}
        >
            <Autocomplete
                filterSelectedOptions
                sx={{ width: 1 }}
                multiple
                value={props.selected}
                options={[...(client.ackings ?? []), ...(client.user ? [client.user] : [])]}
                getOptionKey={(option: User) => option.ccid}
                getOptionLabel={(option: User) => option.profile?.username ?? ''}
                isOptionEqualToValue={(option, value) => option.ccid === value.ccid}
                onChange={(_, value) => {
                    props.setSelected(value)
                }}
                renderInput={(params) => {
                    const { InputLabelProps, InputProps, ...rest } = params
                    return (
                        <InputBase
                            {...params.InputProps}
                            {...rest}
                            sx={{ color: 'props.theme.palette.text.secondary' }}
                            placeholder={props.selected.length === 0 ? t('placeholder') : ''}
                        />
                    )
                }}
                renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                        <CCUserChip
                            avatar
                            user={option}
                            {...getTagProps({ index })}
                            key={option.ccid}
                            onDelete={() => {
                                const newValue = [...value]
                                newValue.splice(index, 1)
                                props.setSelected(newValue)
                            }}
                        />
                    ))
                }
                renderOption={(props, option) => (
                    <ListItem {...props}>
                        <ListItemIcon>
                            <CCAvatar avatarURL={option.profile?.avatar} identiconSource={option.ccid} />
                        </ListItemIcon>
                        <ListItemText primary={option.profile?.username} secondary={option.ccid} />
                    </ListItem>
                )}
            />
        </Box>
    )
}
