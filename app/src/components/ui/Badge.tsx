import { useEffect, useState } from 'react'
import { type Badge } from '../../model'
import { Box, type SxProps, Tooltip } from '@mui/material'
import { type BadgeRef } from '@concrnt/worldlib'
import { useConcord } from '../../context/ConcordContext'

export interface ConcordBadgeProps {
    badgeRef: BadgeRef
    sx?: SxProps
}

export const ConcordBadge = (props: ConcordBadgeProps): JSX.Element => {
    const concord = useConcord()
    const [badge, setBadge] = useState<Badge | null>(null)

    useEffect(() => {
        if (!props.badgeRef.badgeId || !props.badgeRef.seriesId) return
        concord.getBadge(props.badgeRef.seriesId, props.badgeRef.badgeId).then((resp) => {
            setBadge(resp)
        })
    }, [props.badgeRef.badgeId, props.badgeRef.seriesId])

    return (
        <Tooltip arrow title={badge?.name} placement="top">
            <Box
                onClick={(e) => {
                    e.stopPropagation()
                    concord.inspectBadge(props.badgeRef)
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
