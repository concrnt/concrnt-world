import { Collapse, List, ListItem, ListItemButton, ListItemText, Box } from '@mui/material'
import { type StreamList } from '../../model'
import { Link as RouterLink } from 'react-router-dom'

import ExpandMore from '@mui/icons-material/ExpandMore'
import { ListItemTimeline } from './ListItemTimeline'
import { usePreference } from '../../context/PreferenceContext'
import { type ListSubscriptionSchema, type CoreSubscription } from '@concurrent-world/client'
import { useGlobalState } from '../../context/GlobalState'

export interface ListItemSubscriptionTreeProps {
    id: string
    body: StreamList
    onClick?: () => void
}

export const ListItemSubscriptionTree = (props: ListItemSubscriptionTreeProps): JSX.Element => {
    const [lists, updateLists] = usePreference('lists')
    const open = props.body.expanded
    const setOpen = (newOpen: boolean): void => {
        const old = lists
        old[props.id] = {
            ...props.body,
            expanded: newOpen
        }
        updateLists(old)
    }

    const { allKnownSubscriptions } = useGlobalState()
    const subscription = allKnownSubscriptions.find((sub) => sub.id === props.id) as
        | CoreSubscription<ListSubscriptionSchema>
        | undefined

    const iconURL = subscription?.document.body.iconURL

    return (
        <>
            <ListItem
                dense
                sx={{
                    gap: 1
                }}
            >
                <Box
                    sx={{
                        position: 'relative',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '&:hover': {
                            '& .expand-icon': {
                                opacity: 1
                            },
                            '& .list-icon': {
                                opacity: 0
                            }
                        }
                    }}
                >
                    {iconURL ? (
                        <>
                            <img
                                src={iconURL}
                                alt="list icon"
                                className="list-icon"
                                style={{
                                    width: '1.125rem',
                                    height: '1.125rem',
                                    position: 'absolute',
                                    transition: 'opacity 0.2s'
                                }}
                            />
                            <ExpandMore
                                className="expand-icon"
                                onClick={(): void => {
                                    setOpen(!open)
                                }}
                                sx={{
                                    opacity: 0,
                                    position: 'absolute',
                                    transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
                                    transition: 'transform 0.2s, opacity 0.2s'
                                }}
                            />
                        </>
                    ) : (
                        <ExpandMore
                            onClick={(): void => {
                                setOpen(!open)
                            }}
                            sx={{
                                transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
                                transition: 'transform 0.2s'
                            }}
                        />
                    )}
                </Box>
                <ListItemButton
                    dense
                    sx={{
                        padding: 0
                    }}
                    component={RouterLink}
                    to={`/#${props.id}`}
                >
                    {subscription ? (
                        <ListItemText primary={subscription.document.body.name || 'No name'} />
                    ) : (
                        <ListItemText primary="❓ Not found" />
                    )}
                </ListItemButton>
            </ListItem>
            <Collapse in={open} timeout="auto">
                <List dense component="div" disablePadding>
                    {subscription?.items.map((sub) => (
                        <ListItemTimeline
                            key={sub.id}
                            timelineID={sub.id}
                            sx={{
                                pl: 2,
                                gap: 1
                            }}
                            onClick={props.onClick}
                        />
                    ))}
                </List>
            </Collapse>
        </>
    )
}
