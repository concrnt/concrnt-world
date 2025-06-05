import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useEffect, useMemo, useState } from 'react'
import { ClientProvider } from '../context/ClientContext'
import { Dialog, DialogActions, DialogContent, DialogTitle, Fade, Paper, TextField } from '@mui/material'
import { usePersistent } from '../hooks/usePersistent'
import { jumpToDomainRegistration } from '../util'
import { Client, type ProfileSchema } from '@concrnt/worldlib'
import { type Profile, GenerateIdentity, type Identity, LoadIdentity } from '@concrnt/client'
import { RegistrationWelcome } from '../components/Registration/Welcome'
import { ChooseDomain } from '../components/Registration/ChooseDomain'
import { CreateProfile } from '../components/Registration/CreateProfile'
import { RegistrationReady } from '../components/Registration/LetsGo'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import { defaultPreference } from '../context/PreferenceContext'
import { GuestBase } from '../components/GuestBase'
import { Helmet } from 'react-helmet-async'

export default function Registration(): JSX.Element {
    const location = useLocation()

    const { t } = useTranslation('', { keyPrefix: 'registration' })
    const [client, setClient] = useState<Client>()
    const [identity, setIdentity] = usePersistent<Identity>('Identity', GenerateIdentity())
    const [profile, setProfile] = useState<Profile<ProfileSchema> | null>(null)
    const [domain, setDomain] = usePersistent<string>('Domain', 'ariake.concrnt.net')

    const activeStep = parseInt(location.hash.replace('#', '')) || 0
    const setActiveStep = (step: number): void => {
        window.location.hash = step.toString()
    }

    const [dialogOpened, setDialogOpen] = useState(false)
    const [manualKey, setManualKey] = useState('')
    const [errorMessage, setErrorMessage] = useState('')

    const manualIdentity: Identity | null = useMemo(() => {
        const key = LoadIdentity(manualKey)
        if (key) {
            setErrorMessage('')
        } else {
            setErrorMessage('Invalid key')
        }
        return key
    }, [manualKey])

    useEffect(() => {
        Client.create(identity.privateKey, domain, { skipInit: true }).then((c) => {
            setClient(c)
        })
    }, [identity, domain])

    const setupAccount = (): void => {
        if (!client) return
        localStorage.setItem('Domain', JSON.stringify(domain))
        localStorage.setItem('PrivateKey', JSON.stringify(identity.privateKey))

        const storage = JSON.stringify(defaultPreference)
        client.api
            .writeKV('world.concurrent.preference', storage)
            .then(() => {})
            .catch((e) => {
                alert(`Failed to write preference: ${e.message}`)
            })
            .finally(() => {
                window.location.href = '/'
            })
    }

    const steps = [
        {
            title: t('welcome.title'),
            component: (
                <RegistrationWelcome
                    identity={identity}
                    autoSetup={() => {
                        const fqdn = 'ariake.concrnt.net'
                        client?.api.getDomain(fqdn).then((e) => {
                            if (!e) return
                            setDomain(e.fqdn)

                            let next = window.location.href
                            const hashIndex = next.indexOf('#')
                            if (hashIndex !== -1) {
                                next = next.substring(0, hashIndex)
                            }
                            // add next hash
                            next = `${next}#2`

                            jumpToDomainRegistration(identity.CCID, identity.privateKey, fqdn, next)
                        })
                    }}
                    customSetup={() => {
                        setActiveStep(1)
                    }}
                />
            )
        },
        {
            title: t('chooseDomain.title'),
            component: (
                <ChooseDomain
                    identity={identity}
                    next={() => {
                        setActiveStep(2)
                    }}
                    client={client}
                    domain={domain}
                    setDomain={setDomain}
                />
            )
        },
        {
            title: t('createProfile.title'),
            component: (
                <CreateProfile
                    next={() => {
                        setActiveStep(3)
                    }}
                    client={client}
                    setProfile={setProfile}
                />
            )
        },
        {
            title: t('ready.title'),
            component: (
                <RegistrationReady
                    identity={identity}
                    next={() => {
                        setupAccount()
                    }}
                    domain={domain}
                    profile={profile?.parsedDoc?.body ?? {}}
                />
            )
        }
    ]

    return (
        <GuestBase
            sx={{
                padding: 2,
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                gap: 2
            }}
            additionalButton={
                <>
                    {activeStep === 0 && (
                        <Button component={Link} to="/import">
                            {t('importAccount')}
                        </Button>
                    )}
                </>
            }
        >
            <Helmet>
                <meta name="robots" content="noindex" />
            </Helmet>
            <ClientProvider client={client}>
                <>
                    <Paper
                        sx={{
                            display: 'flex',
                            position: 'relative',
                            overflow: 'hidden',
                            width: '100%',
                            flex: 1
                        }}
                    >
                        {steps.map((step, index) => (
                            <Fade key={index} in={activeStep === index}>
                                <Box
                                    sx={{
                                        padding: '20px',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        flex: 1
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            width: '100%',
                                            mb: '30px'
                                        }}
                                    >
                                        <Typography
                                            variant="h1"
                                            sx={{
                                                display: 'flex',
                                                flex: 1,
                                                justifyContent: 'center'
                                            }}
                                        >
                                            {step.title}
                                        </Typography>
                                        {activeStep !== 0 && <Box sx={{ width: '50px' }} />}
                                    </Box>
                                    <Box
                                        sx={{
                                            width: '100%',
                                            flex: 1,
                                            overflowY: 'auto'
                                        }}
                                    >
                                        {step.component}
                                    </Box>
                                </Box>
                            </Fade>
                        ))}
                        {activeStep === 0 && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    width: '100%',
                                    position: 'absolute',
                                    justifyContent: 'space-between',
                                    top: 0,
                                    p: 1
                                }}
                            >
                                <Box />
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        setDialogOpen(true)
                                    }}
                                >
                                    {t('BYOK')}
                                </Button>
                            </Box>
                        )}
                    </Paper>
                    <Dialog
                        open={dialogOpened}
                        onClose={() => {
                            setDialogOpen(false)
                        }}
                    >
                        <DialogTitle>{t('BYOK')}</DialogTitle>
                        <DialogContent>
                            <TextField
                                label={t('keyLabel')}
                                value={manualKey}
                                onChange={(e) => {
                                    setManualKey(e.target.value)
                                }}
                                fullWidth
                            />
                            {errorMessage}
                        </DialogContent>
                        <DialogActions>
                            <Button
                                onClick={() => {
                                    setDialogOpen(false)
                                }}
                            >
                                {t('close')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={!manualIdentity}
                                onClick={() => {
                                    if (!manualIdentity) return
                                    setIdentity(manualIdentity)
                                    setDialogOpen(false)
                                }}
                            >
                                {t('confirm')}
                            </Button>
                        </DialogActions>
                    </Dialog>
                </>
            </ClientProvider>
        </GuestBase>
    )
}
