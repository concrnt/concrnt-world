import { memo, useEffect, useState } from 'react'
import { useClient } from '../../context/ClientContext'
import { Avatar, Box, Button, Divider, IconButton, Link, Paper, Skeleton, TextField, Typography } from '@mui/material'
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1'
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'
import { CCDrawer } from '../ui/CCDrawer'
import { useGlobalState } from '../../context/GlobalState'
import { useTranslation } from 'react-i18next'

interface Stats {
    follows: string[]
    followers: string[]
}

export const ApFollowManager = (): JSX.Element => {
    const { client } = useClient()
    const [stats, setStats] = useState<Stats | null>(null)
    const [userID, setUserID] = useState('')
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false)

    const { t } = useTranslation('', { keyPrefix: 'settings.ap' })

    const follow = (target: string): void => {
        client.api
            .fetchWithCredential(client.host, `/ap/api/follow/${target}`, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                }
            })
            .then((_data) => {
                getStats()
                setDrawerOpen(false)
            })
    }

    const unFollow = (target: string): void => {
        client.api
            .fetchWithCredential(client.host, `/ap/api/follow/${target}`, {
                method: 'DELETE',
                headers: {
                    'content-type': 'application/json'
                }
            })
            .then((_data) => {
                getStats()
            })
    }

    const getStats = (): void => {
        client.api.fetchWithCredential<Stats>(client.host, `/ap/api/stats`, {}).then((data) => {
            setStats(data.content)
        })
    }

    useEffect(() => {
        getStats()
    }, [])

    return (
        <>
            <Box
                display="flex"
                flexDirection={{ xs: 'column', sm: 'column', md: 'row' }}
                gap={1}
                sx={{
                    overflowX: 'hidden',
                    width: '100%'
                }}
            >
                <Box flex={1} display="flex" flexDirection="column" gap={1} overflow="hidden">
                    <Box display="flex" alignItems="center" justifyContent="space-between" height="40px">
                        <Typography variant="h2">
                            {stats?.follows.length} {t('follow')}
                        </Typography>
                        <IconButton
                            sx={{
                                backgroundColor: 'primary.main',
                                mx: 1,
                                '&:hover': {
                                    backgroundColor: 'primary.dark'
                                }
                            }}
                            onClick={() => {
                                setDrawerOpen(true)
                            }}
                        >
                            <PersonAddAlt1Icon
                                sx={{
                                    color: 'primary.contrastText'
                                }}
                            />
                        </IconButton>
                    </Box>
                    {stats?.follows.map((x) => (
                        <APUserCard
                            key={x}
                            url={x}
                            remove={(a) => {
                                unFollow(a.shortID)
                            }}
                        />
                    ))}
                </Box>
                <Box flex={1} display="flex" flexDirection="column" gap={1} overflow="hidden">
                    <Box display="flex" alignItems="center" justifyContent="space-between" height="40px">
                        <Typography variant="h2">
                            {stats?.followers.length} {t('followers')}
                        </Typography>
                    </Box>
                    {stats?.followers.map((x) => <APUserCard key={x} url={x} />)}
                </Box>
            </Box>
            <CCDrawer
                open={drawerOpen}
                onClose={() => {
                    setDrawerOpen(false)
                }}
            >
                <Box display="flex" flexDirection="column" p={1} gap={1}>
                    <Typography variant="h2">{t('followApUser')}</Typography>
                    <Divider />
                    <TextField
                        label="follow"
                        placeholder="@username@host"
                        value={userID}
                        onChange={(x) => {
                            setUserID(x.target.value)
                        }}
                    />
                    <Button
                        onClick={() => {
                            follow(userID)
                        }}
                    >
                        follow
                    </Button>
                </Box>
            </CCDrawer>
        </>
    )
}

export const APUserCard = memo<{ url: string; remove?: (_: { URL: string; shortID: string }) => void }>(
    (props: { url: string; remove?: (_: { URL: string; shortID: string }) => void }): JSX.Element => {
        const { client } = useClient()
        const [person, setPerson] = useState<any>(null)
        const host = props.url.split('/')[2]
        const shortID = `@${person?.preferredUsername}@${host}`

        const { getImageURL } = useGlobalState()

        useEffect(() => {
            client.api
                .fetchWithCredential(client.host, `/ap/api/resolve/${encodeURIComponent(props.url)}`, {
                    method: 'GET',
                    headers: {
                        accept: 'application/ld+json'
                    },
                    cache: 'force-cache'
                })
                .then((data) => {
                    setPerson(data.content)
                })
        }, [props.url])

        if (!person) return <Skeleton variant="rectangular" height={64} />

        return (
            <Paper
                variant="outlined"
                sx={{
                    display: 'flex',
                    p: 1,
                    backgroundImage: person.image
                        ? `url(${getImageURL(person.image.url, { maxHeight: 256 })})`
                        : undefined,
                    backgroundSize: 'cover',
                    gap: 1,
                    textDecoration: 'none',
                    overflow: 'hidden',
                    alignItems: 'center'
                }}
            >
                <Avatar src={getImageURL(person.icon?.url, { maxHeight: 256 })} />
                <Box
                    sx={{
                        display: 'flex',
                        p: 1,
                        borderRadius: 1,
                        flexDirection: 'column',
                        flex: 1,
                        flexShrink: 1,
                        overflow: 'hidden'
                    }}
                >
                    <Typography variant="h3" lineHeight="1">
                        {person.name || person.preferredUsername}
                    </Typography>
                    <Link underline="hover" href={props.url} target="_blank" rel="noopener noreferrer">
                        @{person.preferredUsername}@{host}
                    </Link>
                </Box>
                {props.remove && (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            flexShrink: 0
                        }}
                    >
                        <IconButton
                            onClick={() => props.remove?.({ URL: props.url, shortID })}
                            sx={{
                                backgroundColor: 'rgba(255,255,255,0.8)',
                                '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,1)'
                                }
                            }}
                        >
                            <PersonRemoveIcon />
                        </IconButton>
                    </Box>
                )}
            </Paper>
        )
    }
)

APUserCard.displayName = 'APUserCard'
