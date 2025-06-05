import { Client, User } from '@concrnt/worldlib'
import { useEffect, useMemo, useState } from 'react'
import { GuestBase } from '../components/GuestBase'
import { Box, Button, Paper, Typography } from '@mui/material'
import { useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ClientProvider } from '../context/ClientContext'
import { usePersistent } from '../hooks/usePersistent'
import { GenerateIdentity, Identity } from '@concrnt/client'
import { CCAvatar } from '../components/ui/CCAvatar'
import { jumpToDomainRegistration } from '../util'
import { useTranslation } from 'react-i18next'

export default function Invitation(): JSX.Element {
    const location = useLocation()
    const { t } = useTranslation('', { keyPrefix: 'pages.invitation' })

    const [client, setClient] = useState<Client>()
    const [identity] = usePersistent<Identity>('Identity', GenerateIdentity())

    const hashmap = useMemo(() => {
        const str = location.hash.replace('#', '')
        const split = str.split('&')
        const map: Record<string, string> = {}
        split.forEach((item) => {
            const [key, value] = item.split('=')
            map[key] = value
        })
        return map
    }, [location.hash])

    const inviterID = hashmap['inviter'] || ''
    const ticket = hashmap['ticket'] || ''
    const comment = decodeURIComponent(hashmap['comment'] || 'welcome')
    const preferedDomain = hashmap['domain'] || 'ariake.concrnt.net'
    const preferedTimeline = hashmap['timeline'] || 'ariake.concrnt.net'

    const [domain] = usePersistent<string>('Domain', preferedDomain)

    const [inviter, setInviter] = useState<User | undefined>(undefined)

    useEffect(() => {
        Client.create(identity.privateKey, domain, { skipInit: true }).then((c) => {
            setClient(c)
            c.getUser(inviterID, domain).then((user) => {
                setInviter(user)
            })
        })
    }, [identity, domain])

    useEffect(() => {
        if (preferedTimeline) localStorage.setItem('preferredTimeline', preferedTimeline)
    }, [preferedTimeline])

    return (
        <GuestBase
            sx={{
                padding: 2,
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                gap: 2
            }}
        >
            <Helmet>
                <meta name="robots" content="noindex" />
            </Helmet>
            <ClientProvider client={client}>
                <Paper
                    sx={{
                        display: 'flex',
                        position: 'relative',
                        overflow: 'hidden',
                        width: '100%',
                        flex: 1,
                        alignItems: 'flex-start',
                        justifyContent: 'center'
                    }}
                >
                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        gap={3}
                        mt={'5%'}
                    >
                        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={1}>
                            <Typography
                                sx={{
                                    fontWeight: 'bold',
                                    fontSize: '2.5rem',
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 1,
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'keep-all',
                                    textAlign: 'center'
                                }}
                            >
                                {t('welcome')}
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{
                                    textAlign: 'center',
                                    maxWidth: '90vw',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'keep-all'
                                }}
                            >
                                {t('description')}
                            </Typography>
                        </Box>

                        <Typography
                            variant="h2"
                            sx={{
                                textAlign: 'center',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'keep-all'
                            }}
                        >
                            {t('invitedBy', { username: inviter?.profile?.username })}
                        </Typography>

                        <Box display="flex" flexDirection="row" alignItems="center" justifyContent="center" gap={2}>
                            <CCAvatar
                                avatarURL={inviter?.profile?.avatar}
                                identiconSource={inviterID}
                                circle
                                sx={{
                                    width: 64,
                                    height: 64
                                }}
                            />
                            <Typography
                                variant="h4"
                                sx={{
                                    textAlign: 'center'
                                }}
                            >
                                &lt;&nbsp;{comment}
                            </Typography>
                        </Box>

                        <Button
                            onClick={() => {
                                const next = window.location.origin + '/register#2'
                                jumpToDomainRegistration(identity.CCID, identity.privateKey, domain, next, ticket)
                            }}
                        >
                            {t('createAccount')}
                        </Button>
                    </Box>
                </Paper>
            </ClientProvider>
        </GuestBase>
    )
}
