import { Box, Button, IconButton, List, ListItem, Switch, Tab, Tabs, TextField, Typography } from '@mui/material'
import { StreamPicker } from './ui/StreamPicker'
import { useEffect, useState } from 'react'
import { usePreference } from '../context/PreferenceContext'
import {
    type CoreSubscription,
    type Timeline,
    type CommunityTimelineSchema,
    type ListSubscriptionSchema,
    Schemas
} from '@concurrent-world/client'
import { useClient } from '../context/ClientContext'
import { ListItemTimeline } from './ui/ListItemTimeline'
import PlaylistRemoveIcon from '@mui/icons-material/PlaylistRemove'
import { useTranslation } from 'react-i18next'
import { type StreamList } from '../model'
import { ProfilePicker } from './ui/ProfilePicker'
import { useGlobalState } from '../context/GlobalState'
import { useConfirm } from '../context/Confirm'

export interface ListSettingsProps {
    subscription: CoreSubscription<any>
    onModified?: () => void
}

export function ListSettings(props: ListSettingsProps): JSX.Element {
    const { client } = useClient()
    const confirm = useConfirm()

    const [lists, setLists] = usePreference('lists')
    const list = lists[props.subscription.id]

    const { allProfiles } = useGlobalState()
    const { allKnownTimelines } = useGlobalState()

    const [listName, setListName] = useState<string>('')

    const { t } = useTranslation('', { keyPrefix: 'ui.listSettings' })

    const [postStreams, setPostStreams] = useState<Array<Timeline<CommunityTimelineSchema>>>([])

    const [tab, setTab] = useState<'stream' | 'user'>('stream')

    useEffect(() => {
        setListName(props.subscription.document.body.name)

        if (!list) return
        Promise.all(list.defaultPostStreams.map((streamID) => client.getTimeline(streamID))).then((streams) => {
            setPostStreams(streams.filter((stream) => stream !== null) as Array<Timeline<CommunityTimelineSchema>>)
        })
    }, [props.subscription])

    const updateList = (id: string, list: StreamList): void => {
        const old = lists
        old[id] = list
        setLists(JSON.parse(JSON.stringify(old)))
    }

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                p: 1
            }}
        >
            <Typography variant="h2">{t('title')}</Typography>
            {props.subscription.schema === Schemas.listSubscription && (
                <>
                    <Typography variant="h3">{t('name')}</Typography>
                    <Box display="flex" flexDirection="row" gap={1}>
                        <TextField
                            label="list name"
                            variant="outlined"
                            value={listName}
                            sx={{
                                flexGrow: 1
                            }}
                            onChange={(e) => {
                                setListName(e.target.value)
                            }}
                        />
                        <Button
                            onClick={(_) => {
                                client.api
                                    .upsertSubscription<ListSubscriptionSchema>(
                                        props.subscription.schema,
                                        {
                                            name: listName
                                        },
                                        {
                                            id: props.subscription.id,
                                            indexable: props.subscription.indexable,
                                            owner: props.subscription.owner
                                        }
                                    )
                                    .then((_) => {
                                        props.onModified?.()
                                    })
                            }}
                        >
                            {t('update')}
                        </Button>
                    </Box>
                </>
            )}
            {list && (
                <>
                    <Typography variant="h3">{t('defaultDest')}</Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            flex: 1
                        }}
                    >
                        <StreamPicker
                            options={allKnownTimelines}
                            selected={postStreams}
                            setSelected={(value) => {
                                updateList(props.subscription.id, {
                                    ...list,
                                    defaultPostStreams: value.map((e) => e.cacheKey ?? e.id)
                                })
                                setPostStreams(value)
                            }}
                            placeholder={t('addDefaultDest')}
                        />
                    </Box>
                    <Typography variant="h3">{t('postWithHome')}</Typography>
                    <Switch
                        checked={list.defaultPostHome === undefined ? true : list.defaultPostHome}
                        onChange={(_) => {
                            updateList(props.subscription.id, {
                                ...list,
                                defaultPostHome: !list.defaultPostHome
                            })
                        }}
                    />
                    <Typography variant="h3">{t('defaultProfile')}</Typography>
                    <ProfilePicker
                        selected={allProfiles.find((p) => p.id === list.defaultProfile)}
                        setSelected={(p) => {
                            updateList(props.subscription.id, {
                                ...list,
                                defaultProfile: p?.id
                            })
                        }}
                    />
                    <Typography variant="h3">{t('pin')}</Typography>
                    <Switch
                        checked={list.pinned}
                        onChange={(_) => {
                            updateList(props.subscription.id, {
                                ...list,
                                pinned: !list.pinned
                            })
                        }}
                    />
                </>
            )}
            <Button
                color="error"
                onClick={(_) => {
                    confirm.open(
                        t('reallyDelete'),
                        () => {
                            if (lists[props.subscription.id]) {
                                const old = lists
                                delete old[props.subscription.id]
                                setLists(JSON.parse(JSON.stringify(old)))
                            }
                            client.api.deleteSubscription(props.subscription.id).then((_) => {
                                props.onModified?.()
                            })
                        },
                        {
                            description: props.subscription.document.body.name,
                            confirmText: t('confirmDelete')
                        }
                    )
                }}
            >
                {t('delete')}
            </Button>
            <Tabs
                value={tab}
                onChange={(_, value) => {
                    setTab(value)
                }}
                textColor="secondary"
                indicatorColor="secondary"
            >
                <Tab label={t('community')} value="stream" />
                <Tab label={t('user')} value="user" />
            </Tabs>
            <List>
                {props.subscription.items
                    .filter((sub) => sub.resolverType === (tab === 'user' ? 0 : 1))
                    .map((sub) => (
                        <ListItem
                            key={sub.id}
                            disablePadding
                            secondaryAction={
                                <IconButton
                                    onClick={(_) => {
                                        client.api.unsubscribe(sub.id, sub.subscription).then((_) => {
                                            props.onModified?.()
                                        })
                                    }}
                                >
                                    <PlaylistRemoveIcon />
                                </IconButton>
                            }
                        >
                            <ListItemTimeline timelineID={sub.id} />
                        </ListItem>
                    ))}
            </List>
        </Box>
    )
}
