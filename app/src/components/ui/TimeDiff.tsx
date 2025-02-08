import { humanReadableTimeDiff } from '../../util'
import { Box, Tooltip } from '@mui/material'
import { useTicker } from '../../context/Ticker'

import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff'

export interface TimeDiffProps {
    date: Date
    base?: Date
}

// 1 hour
const threshold = 60 * 60 * 1000

export const TimeDiff = (props: TimeDiffProps): JSX.Element => {
    useTicker()

    const diff = props.base ? Math.abs(props.date.getTime() - props.base.getTime()) : 0
    const diffTooLong = diff > threshold

    return (
        <Tooltip
            placement="left"
            title={diffTooLong ? 'server time: ' + props.base!.toLocaleString() : props.date.toLocaleString()}
        >
            <Box component="span" width="max-content" display="flex" alignItems="center" gap={0.5}>
                {diffTooLong && (
                    <HistoryToggleOffIcon
                        sx={{
                            fontSize: '0.75rem',
                            marginLeft: '0.25rem'
                        }}
                    />
                )}
                {humanReadableTimeDiff(props.date)}
            </Box>
        </Tooltip>
    )
}
