import { useState } from 'react'
import { type Badge } from '../../model'
import { Box, type SxProps, Tooltip } from '@mui/material'
import { type BadgeRef } from '@concrnt/worldlib'

export interface ConcordBadgeProps {
    badgeRef: BadgeRef
    sx?: SxProps
}

export const ConcordBadge = (props: ConcordBadgeProps): JSX.Element => {
    const [badge, setBadge] = useState<Badge | null>(null)

    return (
        <Tooltip arrow title={badge?.name} placement="top">
            <Box
                onClick={(e) => {
                    e.stopPropagation()
                }}
                component="img"
                src={badge?.uri}
                sx={{
                    ...props.sx,
                    cursor: 'pointer'
                }}
            />
        </Tooltip>
    )
}
