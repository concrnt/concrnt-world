import { Box, Divider, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useClient } from '../context/ClientContext'
import { useEffect, useMemo, useState } from 'react'
import { TimelineFilter } from '../components/TimelineFilter'
import { Helmet } from 'react-helmet-async'
import { NotificationTimeline } from '../components/NotificationTimeline'
import { usePreference } from '../context/PreferenceContext'

export function Notifications(props: { latestNotification: number }): JSX.Element {
    const { t } = useTranslation('', { keyPrefix: 'pages.notifications' })
    const { client } = useClient()

    const timeline = client.user?.notificationTimeline

    const [selected, setSelected] = useState<string | undefined>(undefined)

    const query = useMemo(() => {
        return selected ? { schema: selected } : {}
    }, [selected])

    const [latestSeenNotification, setLatestSeenNotification] = usePreference('lastSeenNotification')

    useEffect(() => {
        if (latestSeenNotification !== props.latestNotification) {
            setLatestSeenNotification(props.latestNotification)
        }
    }, [props.latestNotification])

    return (
        <>
            <Helmet>
                <title>{t('title')} - Concrnt</title>
                <meta name="description" content={t('description')} />
            </Helmet>
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
                        paddingX: 1,
                        paddingTop: 1
                    }}
                >
                    <Typography variant="h2">{t('title')}</Typography>
                    <Divider />
                    <TimelineFilter selected={selected} setSelected={setSelected} />
                    <Divider />
                </Box>
                {timeline && <NotificationTimeline timeline={timeline} query={query} />}
            </Box>
        </>
    )
}
