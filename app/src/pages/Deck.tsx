import { Box, Button, Paper, Typography } from '@mui/material'
import { useMemo } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { usePreference } from '../context/PreferenceContext'
import { RealtimeTimeline } from '../components/RealtimeTimeline'
import { type ListSubscriptionSchema } from '@concrnt/worldlib'
import { type Subscription as CoreSubscription } from '@concrnt/client'
import ExploreIcon from '@mui/icons-material/Explore'
import ListIcon from '@mui/icons-material/List'
import { TimelineHeader } from '../components/TimelineHeader'
import { useGlobalState } from '../context/GlobalState'

export function DeckPage(): JSX.Element {
    const [lists] = usePreference('lists')
    const { allKnownSubscriptions } = useGlobalState()

    const subscriptions = useMemo(() => {
        const pinnedSubscriptionIDs = Object.keys(lists).filter((e) => lists[e].pinned)
        return pinnedSubscriptionIDs
            .map((e) => allKnownSubscriptions.find((sub) => sub.id === e))
            .filter((e) => e !== undefined) as CoreSubscription<ListSubscriptionSchema>[]
    }, [allKnownSubscriptions, lists])

    console.log('subscriptions', subscriptions)

    return (
        <Box
            sx={{
                backgroundColor: 'background.default',
                display: 'flex',
                flexDirection: 'row',
                height: '100%',
                overflowX: 'auto',
                overflowY: 'hidden',
                gap: 1
            }}
        >
            {subscriptions.map((subscription) => (
                <Deck key={subscription.id} subscription={subscription} />
            ))}
        </Box>
    )
}

interface DeckProps {
    subscription: CoreSubscription<ListSubscriptionSchema>
}

export function Deck(props: DeckProps): JSX.Element {
    const timelines = useMemo(() => props.subscription?.items.map((e) => e.id) ?? [], [props.subscription])

    return (
        <Paper
            sx={{
                width: '100%',
                minWidth: '400px',
                minHeight: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
        >
            <TimelineHeader
                title={props.subscription.parsedDoc.body.name ?? 'No Name'}
                titleIcon={
                    props.subscription.parsedDoc.body.iconURL ? (
                        <img
                            src={props.subscription.parsedDoc.body.iconURL}
                            alt="list icon"
                            style={{
                                height: '1.125rem'
                            }}
                        />
                    ) : (
                        <ListIcon />
                    )
                }
            />
            <>
                {timelines.length > 0 ? (
                    <RealtimeTimeline timelineFQIDs={timelines} />
                ) : (
                    <Box
                        sx={{
                            marginTop: 4,
                            alignItems: 'center',
                            justifyContent: 'center',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <Box
                            style={{
                                display: 'flex',
                                marginTop: 8,
                                marginLeft: 8,
                                marginRight: 8,
                                flexDirection: 'column',
                                alignItems: 'center'
                            }}
                        >
                            <Button component={RouterLink} to="/explorer/timelines">
                                <Typography variant="h1" sx={{ fontWeight: 600, mx: 1 }}>
                                    Go Explore
                                </Typography>
                                <ExploreIcon sx={{ fontSize: '10rem', verticalAlign: 'middle' }} />
                            </Button>
                            <p>---</p>
                        </Box>
                    </Box>
                )}
            </>
        </Paper>
    )
}
