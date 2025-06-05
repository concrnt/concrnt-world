import { Client } from '@concrnt/worldlib'
import { Domain } from '@concrnt/client'
import { useEffect, useState } from 'react'
import { useClient } from '../context/ClientContext'
import { Box, Typography, Avatar, TextField, Stepper, Step, StepLabel, StepContent, Button } from '@mui/material'
import { LogoutButton } from './Settings/LogoutButton'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { jumpToDomainRegistration } from '../util'
import { useSnackbar } from 'notistack'
import { RepositoryExportButton, RepositoryImportButton } from './RepositoryManageButtons'
import { usePersistent } from '../hooks/usePersistent'
import { type JobRequest } from '../model'
import { useTranslation } from 'react-i18next'

export function Migrator(): JSX.Element {
    const { t } = useTranslation('', { keyPrefix: 'ui.migrator' })

    const { client } = useClient()
    const [currentDomain, setCurrentDomain] = useState<Domain | null>(null)
    const [destFqdn, setDestFqdn] = usePersistent<string>('migrator-dest-fqdn', '')
    const [destinationDomain, setDestinationDomain] = useState<Domain | null>(null)
    const activeStep = parseInt(location.hash.replace('#', '')) || 0
    const setActiveStep = (step: number): void => {
        window.location.hash = step.toString()
    }
    const [imported, setImported] = useState(false)
    const { enqueueSnackbar } = useSnackbar()

    useEffect(() => {
        if (!client) return
        client.api.getDomain(client.host).then((e) => {
            setCurrentDomain(e ?? null)
        })
    }, [client])

    useEffect(() => {
        if (!client) return
        if (!destFqdn) return
        setDestinationDomain(null)
        let unmounted = false
        const timer = setTimeout(() => {
            client.api.getDomain(destFqdn).then((e) => {
                if (unmounted) return
                setDestinationDomain(e ?? null)
            })
        }, 300)
        return () => {
            unmounted = true
            clearTimeout(timer)
        }
    }, [client, destFqdn])

    const steps = [
        {
            label: t('step0.title'),
            content: (
                <>
                    <TextField
                        label={t('step0.migrateTo')}
                        fullWidth
                        value={destFqdn}
                        onChange={(e) => {
                            setDestFqdn(e.target.value)
                        }}
                    />
                    <Box display="flex" flexDirection="row" justifyContent="space-between">
                        <Box />
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => {
                                setActiveStep(activeStep + 1)
                            }}
                            disabled={
                                currentDomain === null ||
                                destinationDomain === null ||
                                currentDomain.fqdn === destinationDomain.fqdn
                            }
                        >
                            {t('next')}
                        </Button>
                    </Box>
                </>
            )
        },
        {
            label: t('step1.title'),
            content: (
                <Box display="flex" flexDirection="column" gap={2}>
                    <Typography>{t('step1.desc')}</Typography>
                    <Button
                        fullWidth
                        color="primary"
                        onClick={() => {
                            console.log(client.ccid, client.keyPair)
                            jumpToDomainRegistration(
                                client.ccid!,
                                client.keyPair!.privatekey,
                                destFqdn,
                                window.location.href
                            )
                        }}
                    >
                        {t('step1.move')}
                    </Button>
                    <Box display="flex" flexDirection="row" justifyContent="space-between">
                        <Box />
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => {
                                fetch(`https://${destFqdn}/api/v1/entity/${client.ccid!}`)
                                    .then((e) => e.json())
                                    .then((e) => {
                                        if (e.content.domain === destFqdn) {
                                            setActiveStep(activeStep + 1)
                                        } else {
                                            enqueueSnackbar(t('step1.error', { domain: e.content.domain }), {
                                                variant: 'error'
                                            })
                                        }
                                    })
                            }}
                        >
                            {t('step1.checkAndNext')}
                        </Button>
                    </Box>
                </Box>
            )
        },
        {
            label: t('step2.title'),
            content: (
                <>
                    <RepositoryExportButton />
                    <Box display="flex" flexDirection="row" justifyContent="space-between">
                        <Box />
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => {
                                setActiveStep(activeStep + 1)
                            }}
                        >
                            {t('next')}
                        </Button>
                    </Box>
                </>
            )
        },
        {
            label: t('step3.title'),
            content: (
                <>
                    <Typography>{t('step3.desc')}</Typography>
                    <RepositoryImportButton
                        source={client.host}
                        domain={destFqdn}
                        onImport={(err: string) => {
                            setImported(err === '')
                        }}
                    />
                    <Box display="flex" flexDirection="row" justifyContent="space-between">
                        <Box />

                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => {
                                setActiveStep(activeStep + 1)
                            }}
                        >
                            {t('next')}
                        </Button>
                    </Box>
                </>
            )
        },
        {
            label: t('step4.title'),
            content: (
                <>
                    <Button
                        fullWidth
                        onClick={() => {
                            const settings = localStorage.getItem('preference')
                            if (!settings) return
                            Client.create(client.keyPair!.privatekey, destFqdn).then((remoteClient) => {
                                remoteClient.api
                                    .writeKV('world.concurrent.preference', settings)
                                    .then((_) => {
                                        setActiveStep(activeStep + 1)
                                    })
                                    .catch((e) => {
                                        console.error(e)
                                        enqueueSnackbar(t('step4.error'), { variant: 'error' })
                                    })
                            })
                        }}
                    >
                        {t('step4.exec')}
                    </Button>
                </>
            ),
            ok: () => imported
        },
        {
            label: t('step5.title'),
            content: (
                <>
                    <Typography>{t('step5.desc')}</Typography>
                    <Button
                        onClick={() => {
                            const job: JobRequest = {
                                type: 'clean',
                                payload: '{}',
                                scheduled: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
                            }

                            client?.api
                                .fetchWithCredential(client.host, '/api/v1/jobs', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify(job)
                                })
                                .then(async (_res) => {
                                    setActiveStep(activeStep + 1)
                                })
                        }}
                    >
                        {t('step5.exec')}
                    </Button>
                </>
            ),
            ok: () => false
        },
        {
            label: t('done.title'),
            content: (
                <Button
                    onClick={() => {
                        if (!destinationDomain) return
                        client.api.invalidateEntity(client.ccid!)
                        localStorage.setItem('Domain', JSON.stringify(destinationDomain.fqdn))
                        window.location.href = '/'
                    }}
                >
                    {t('done.reload')}
                </Button>
            )
        }
    ]

    if (client.ckid)
        return (
            <>
                <Typography>{t('masterLoginRequired')}</Typography>
                <LogoutButton />
            </>
        )

    return (
        <>
            <Box display="flex" flexDirection="row" alignItems="center" justifyContent="space-around">
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                    <Typography variant="h3">{currentDomain?.meta.nickname}</Typography>
                    <Avatar
                        src={currentDomain?.meta.logo}
                        sx={{
                            width: 100,
                            height: 100
                        }}
                    />
                </Box>
                <ArrowForwardIcon
                    sx={{
                        fontSize: 100
                    }}
                />
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                    <Typography variant="h3">{destinationDomain?.meta.nickname ?? '???'}</Typography>
                    <Avatar
                        src={destinationDomain?.meta.logo}
                        sx={{
                            width: 100,
                            height: 100
                        }}
                    >
                        ?
                    </Avatar>
                </Box>
            </Box>
            <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((step, _) => (
                    <Step key={step.label}>
                        <StepLabel>{step.label}</StepLabel>
                        <StepContent>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1
                                }}
                            >
                                {step.content}
                            </Box>
                        </StepContent>
                    </Step>
                ))}
            </Stepper>
        </>
    )
}
