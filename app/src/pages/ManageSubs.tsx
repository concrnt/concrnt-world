import { Box, Button, Divider, IconButton, List, Typography } from '@mui/material'
import { useClient } from '../context/ClientContext'
import { useTranslation } from 'react-i18next'
import { usePreference } from '../context/PreferenceContext'

import { useState } from 'react'
import { Schemas } from '@concrnt/worldlib'
import { Subscription } from '@concrnt/client'

import AddIcon from '@mui/icons-material/Add'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'

import { ListSettings } from '../components/ListSettings'
import { CCDrawer } from '../components/ui/CCDrawer'
import { type StreamList } from '../model'
import { ListItemSubscription } from '../components/ui/ListItemSubscription'
import { useGlobalState } from '../context/GlobalState'
import { Helmet } from 'react-helmet-async'

export function ManageSubsPage(): JSX.Element {
    const { t } = useTranslation('', { keyPrefix: 'pages.manageSubs' })
    const { client } = useClient()
    const [lists, setLists] = usePreference('lists')

    const { reloadList, allKnownSubscriptions } = useGlobalState()

    const listedSubs: string[] = Object.keys(lists)
    const unlistedSubs: Array<Subscription<any>> = allKnownSubscriptions.filter(
        (sub) => !Object.keys(lists).includes(sub.id)
    )
    const [inspectedSub, setInspectedSub] = useState<Subscription<any> | null>(null)

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
                        padding: '20px 20px 0 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}
                >
                    <Typography variant="h2">{t('title')}</Typography>

                    <Divider
                        sx={{
                            margin: '10px 0'
                        }}
                    />
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            flex: '1',
                            gap: 1,
                            mb: 2
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 1,
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}
                        >
                            <Typography variant="h3">{t('listed')}</Typography>
                            <Button
                                onClick={() => {
                                    client.api
                                        .upsertSubscription(
                                            Schemas.listSubscription,
                                            {
                                                name: t('newlist')
                                            },
                                            {
                                                indexable: false
                                            }
                                        )
                                        .then((_subscription) => {
                                            reloadList()
                                        })
                                        .catch((error) => {
                                            console.error(error)
                                        })
                                }}
                                endIcon={<AddIcon />}
                            >
                                {t('new')}
                            </Button>
                        </Box>

                        <List dense disablePadding>
                            {listedSubs.map((subid, i) => (
                                <ListItemSubscription
                                    id={subid}
                                    key={subid}
                                    onClick={() => {
                                        const target = allKnownSubscriptions.find((sub) => sub.id === subid)
                                        if (target) {
                                            setInspectedSub(target)
                                        } else {
                                            console.error('not found')
                                        }
                                    }}
                                    secondaryAction={
                                        <Box>
                                            <IconButton
                                                disabled={i === 0}
                                                onClick={() => {
                                                    const keys = Object.keys(lists)
                                                    const tmp = keys[i]
                                                    keys[i] = keys[i - 1]
                                                    keys[i - 1] = tmp

                                                    const newLists = new Map<string, StreamList>()
                                                    for (const key of keys) {
                                                        newLists.set(key, lists[key])
                                                    }

                                                    setLists(Object.fromEntries(newLists))
                                                }}
                                            >
                                                <ArrowUpwardIcon />
                                            </IconButton>
                                            <IconButton
                                                disabled={i === listedSubs.length - 1}
                                                onClick={() => {
                                                    const keys = Object.keys(lists)
                                                    const tmp = keys[i]
                                                    keys[i] = keys[i + 1]
                                                    keys[i + 1] = tmp

                                                    const newLists = new Map<string, StreamList>()
                                                    for (const key of keys) {
                                                        newLists.set(key, lists[key])
                                                    }

                                                    setLists(Object.fromEntries(newLists))
                                                }}
                                            >
                                                <ArrowDownwardIcon />
                                            </IconButton>
                                            <IconButton
                                                disabled={listedSubs.length === 1}
                                                onClick={() => {
                                                    const old = lists
                                                    delete old[subid]
                                                    setLists(old)
                                                }}
                                            >
                                                <RemoveCircleOutlineIcon />
                                            </IconButton>
                                        </Box>
                                    }
                                />
                            ))}
                        </List>
                    </Box>

                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            flex: '1',
                            gap: 1
                        }}
                    >
                        <Typography variant="h3" gutterBottom>
                            {t('unlisted')}
                        </Typography>
                        <List dense disablePadding>
                            {unlistedSubs.map((sub) => (
                                <ListItemSubscription
                                    id={sub.id}
                                    key={sub.id}
                                    onClick={() => {
                                        setInspectedSub(sub)
                                    }}
                                    secondaryAction={
                                        <Box>
                                            <IconButton
                                                onClick={() => {
                                                    const old = lists
                                                    old[sub.id] = {
                                                        pinned: false,
                                                        isIconTab: false,
                                                        expanded: false,
                                                        defaultPostHome: true,
                                                        defaultPostStreams: []
                                                    }
                                                    setLists(old)
                                                }}
                                            >
                                                <AddCircleOutlineIcon />
                                            </IconButton>
                                        </Box>
                                    }
                                />
                            ))}
                        </List>
                    </Box>
                </Box>
                <CCDrawer
                    open={!!inspectedSub}
                    onClose={() => {
                        setInspectedSub(null)
                    }}
                >
                    {inspectedSub ? (
                        <ListSettings
                            subscription={inspectedSub}
                            onModified={() => {
                                reloadList()
                                setInspectedSub(null)
                            }}
                        />
                    ) : (
                        <>Loading...</>
                    )}
                </CCDrawer>
            </Box>
        </>
    )
}
