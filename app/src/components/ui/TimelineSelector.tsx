import { Autocomplete, Box, InputBase, TextField, type SxProps } from '@mui/material'
import { type CommunityTimelineSchema, type Timeline } from '@concrnt/worldlib'
import { useMemo } from 'react'

import TagIcon from '@mui/icons-material/Tag'
import LockIcon from '@mui/icons-material/Lock'
import { useGlobalState } from '../../context/GlobalState'

export interface TimelineSelectorProps {
    selected: Timeline<CommunityTimelineSchema> | undefined
    setSelected: (selected: Timeline<CommunityTimelineSchema>) => void
    sx?: SxProps
    placeholder?: string
    label?: string
}

export const TimelineSelector = (props: TimelineSelectorProps): JSX.Element => {
    const { allKnownTimelines } = useGlobalState()

    const communities = useMemo(() => {
        return allKnownTimelines.filter((e) => e.schema === 'https://schema.concrnt.world/t/community.json')
    }, [allKnownTimelines])

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
                disableClearable
                sx={{ width: 1 }}
                value={props.selected}
                options={communities}
                getOptionKey={(option: Timeline<CommunityTimelineSchema>) => option.id ?? ''}
                getOptionLabel={(option: Timeline<CommunityTimelineSchema>) => option.document?.body?.name ?? ''}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(_, value) => {
                    props.setSelected(value)
                }}
                forcePopupIcon={false}
                renderInput={(params) => <TextField {...params} label={props.label} />}
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
        </Box>
    )
}
