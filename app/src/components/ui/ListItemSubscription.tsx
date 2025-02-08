import { ListItem, ListItemButton, ListItemText } from '@mui/material'
import { type ListSubscriptionSchema } from '@concrnt/worldlib'
import { type Subscription } from '@concrnt/client'
import { useGlobalState } from '../../context/GlobalState'

export interface ListItemSubscriptionProps {
    id: string
    onClick?: () => void
    secondaryAction?: JSX.Element | JSX.Element[]
}

export const ListItemSubscription = (props: ListItemSubscriptionProps): JSX.Element => {
    const { allKnownSubscriptions } = useGlobalState()
    const subscription = allKnownSubscriptions.find((sub) => sub.id === props.id) as
        | Subscription<ListSubscriptionSchema>
        | undefined

    return (
        <ListItem
            dense
            disablePadding
            sx={{
                gap: 1
            }}
            secondaryAction={props.secondaryAction}
        >
            <ListItemButton dense onClick={props.onClick}>
                {subscription ? (
                    <ListItemText primary={subscription.parsedDoc.body.name || 'No name'} />
                ) : (
                    <ListItemText primary="❓ Not found" />
                )}
            </ListItemButton>
        </ListItem>
    )
}
