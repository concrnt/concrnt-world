import { Autocomplete, Box, InputBase, type SxProps } from '@mui/material'
import { type CommunityTimelineSchema, type Timeline } from '@concurrent-world/client'
import { CCChip } from './CCChip'

import TagIcon from '@mui/icons-material/Tag'
import LockIcon from '@mui/icons-material/Lock'
import { isPrivateTimeline } from '../../util'
import { useMemo } from 'react'

export interface StreamPickerProps {
    selected: Array<Timeline<CommunityTimelineSchema>>
    setSelected: (selected: Array<Timeline<CommunityTimelineSchema>>) => void
    sx?: SxProps
    options: Array<Timeline<CommunityTimelineSchema>>
    placeholder?: string
}

export const StreamPicker = (props: StreamPickerProps): JSX.Element => {
    const communities = useMemo(() => {
        return props.options.filter((e) => e.schema === 'https://schema.concrnt.world/t/community.json')
    }, [props.options])

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
                componentsProps={{
                    clearIndicator: { sx: { color: 'text.disabled' } }
                }}
                forcePopupIcon={false}
                renderInput={(params) => {
                    const { InputLabelProps, InputProps, ...rest } = params

                    return (
                        <InputBase
                            {...params.InputProps}
                            {...rest}
                            sx={{ color: 'props.theme.palette.text.secondary' }}
                            placeholder={props.placeholder}
                        />
                    )
                }}
                renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                        <CCChip
                            size="small"
                            icon={isPrivateTimeline(option) ? <LockIcon /> : <TagIcon />}
                            label={option.document.body.name}
                            sx={{ color: 'text.default' }}
                            {...getTagProps({ index })}
                            key={option.id}
                        />
                    ))
                }
                renderOption={(props, option, _state, _ownerState) => (
                    <Box
                        key={option.id}
                        component="li"
                        sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 0.5
                        }}
                        {...props}
                    >
                        {isPrivateTimeline(option) ? <LockIcon /> : <TagIcon />}
                        {option.document.body.name}
                    </Box>
                )}
            />
        </Box>
    )
}
