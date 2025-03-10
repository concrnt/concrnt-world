import {
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    IconButton,
    List,
    ListItem,
    Switch,
    Tab,
    Tabs,
    TextField,
    Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import { usePreference } from '../context/PreferenceContext'
import {
    type Timeline,
    type CommunityTimelineSchema,
    type ListSubscriptionSchema,
    Schemas,
    ProfileSchema
} from '@concrnt/worldlib'
import { Profile, type Subscription } from '@concrnt/client'
import { useClient } from '../context/ClientContext'
import { ListItemTimeline } from './ui/ListItemTimeline'
import PlaylistRemoveIcon from '@mui/icons-material/PlaylistRemove'
import { useTranslation } from 'react-i18next'
import { type StreamList } from '../model'
import { useGlobalState } from '../context/GlobalState'
import { useConfirm } from '../context/Confirm'
import DeleteIcon from '@mui/icons-material/Delete'
import { useEmojiPicker } from '../context/EmojiPickerContext'
import { CCIconButton } from './ui/CCIconButton'
import EmojiEmotions from '@mui/icons-material/EmojiEmotions'
import { TimelinePicker } from './ui/TimelinePicker'

export interface ListSettingsProps {
    subscription: Subscription<any>
    onModified?: () => void
}

export function ListSettings(props: ListSettingsProps): JSX.Element {
    const { client } = useClient()
    const confirm = useConfirm()

    const [lists, setLists] = usePreference('lists')

    const list = lists[props.subscription.id]

    const { allKnownTimelines } = useGlobalState()

    const [defaultProfile, setDefaultProfile] = useState<Profile<ProfileSchema> | undefined>(undefined)
    const [listName, setListName] = useState<string>('')
    const [iconURL, setIconURL] = useState<string>('')

    const { t } = useTranslation('', { keyPrefix: 'ui.listSettings' })

    const [postStreams, setPostStreams] = useState<Array<Timeline<CommunityTimelineSchema>>>([])

    const [tab, setTab] = useState<'stream' | 'user'>('stream')

    const emojiPicker = useEmojiPicker()

    useEffect(() => {
        setListName(props.subscription.parsedDoc.body.name)
        setIconURL(props.subscription.parsedDoc.body.iconURL ?? '')

        if (!list) return
        Promise.all(list.defaultPostStreams.map((streamID) => client.getTimeline(streamID))).then((streams) => {
            setPostStreams(streams.filter((stream) => stream !== null) as Array<Timeline<CommunityTimelineSchema>>)
        })
        if (list.defaultProfile) {
            client.api.getProfile<ProfileSchema>(list.defaultProfile, client.ccid!).then((profile) => {
                setDefaultProfile(profile)
            })
        }
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
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            gap: 2,
                            alignItems: 'center'
                        }}
                    >
                        <Box
                            sx={{
                                position: 'relative',
                                cursor: 'pointer'
                            }}
                            onClick={(e) => {
                                emojiPicker.open(e.currentTarget, (emoji) => {
                                    setIconURL(emoji.imageURL)
                                    emojiPicker.close()
                                })
                            }}
                        >
                            {iconURL ? (
                                <Box
                                    sx={{
                                        position: 'relative'
                                    }}
                                >
                                    <img
                                        src={iconURL}
                                        alt="list icon"
                                        style={{
                                            width: 'calc(1.125rem * 1.6)',
                                            height: 'calc(1.125rem * 1.6)'
                                        }}
                                    />
                                    <CCIconButton
                                        sx={{
                                            position: 'absolute',
                                            p: 0.1,
                                            right: -10,
                                            bottom: -10,
                                            backgroundColor: 'background.paper'
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setIconURL('')
                                        }}
                                    >
                                        <DeleteIcon sx={{ fontSize: '1.125rem' }} />
                                    </CCIconButton>
                                </Box>
                            ) : (
                                <EmojiEmotions sx={{ fontSize: 'calc(1.125rem * 1.6)' }} />
                            )}
                        </Box>
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
                                            name: listName,
                                            iconURL
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
                        <TimelinePicker
                            options={allKnownTimelines}
                            selected={postStreams}
                            setSelected={(value) => {
                                updateList(props.subscription.id, {
                                    ...list,
                                    defaultPostStreams: value.map((e) => e.fqid).filter((e) => e !== null)
                                })
                                setPostStreams(value)
                            }}
                            postHome={list.defaultPostHome === undefined ? true : list.defaultPostHome}
                            setPostHome={(value) => {
                                updateList(props.subscription.id, {
                                    ...list,
                                    defaultPostHome: value
                                })
                            }}
                            selectedSubprofile={defaultProfile}
                            setSelectedSubprofile={(value) => {
                                updateList(props.subscription.id, {
                                    ...list,
                                    defaultProfile: value?.id
                                })
                            }}
                            placeholder={t('addDefaultDest')}
                        />
                    </Box>
                    <Typography variant="h3">{t('pin')}</Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1,
                            flex: 1,
                            alignItems: 'center'
                        }}
                    >
                        <Switch
                            checked={list.pinned}
                            onChange={(_) => {
                                updateList(props.subscription.id, {
                                    ...list,
                                    pinned: !list.pinned
                                })
                            }}
                        />
                        {list.pinned && iconURL ? (
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={list.isIconTab}
                                        onChange={(e) => {
                                            updateList(props.subscription.id, {
                                                ...list,
                                                isIconTab: e.target.checked
                                            })
                                        }}
                                    />
                                }
                                label={t('isIconTab')}
                            />
                        ) : (
                            <></>
                        )}
                    </Box>
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
                            description: props.subscription.parsedDoc.body.name,
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
