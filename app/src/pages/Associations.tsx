import { Box, Divider, Typography } from '@mui/material'
import { useMemo } from 'react'
import { RealtimeTimeline } from '../components/RealtimeTimeline'
import { useClient } from '../context/ClientContext'

export function Associations(): JSX.Element {
    const { client } = useClient()

    const timelines = useMemo(() => {
        const target = client.user?.notificationTimeline
        return target ? [target] : []
    }, [client])

    return (
        <Box
            sx={{
                width: '100%',
                minHeight: '100%',
                backgroundColor: 'background.paper',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <Box
                sx={{
                    padding: '20px 20px 0 20px'
                }}
            >
                <Typography variant="h2" gutterBottom>
                    Associations
                </Typography>
                <Divider />
            </Box>
            <RealtimeTimeline timelineFQIDs={timelines} />
        </Box>
    )
}
