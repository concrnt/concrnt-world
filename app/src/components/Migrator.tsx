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

export function Migrator(): JSX.Element {
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
            label: '引っ越し先の入力',
            content: (
                <>
                    <TextField
                        label="移行先ドメイン"
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
                            次へ
                        </Button>
                    </Box>
                </>
            )
        },
        {
            label: '引っ越し先に登録',
            content: (
                <Box display="flex" flexDirection="column" gap={2}>
                    <Typography>まずは引っ越し先ドメインにて登録を行います。</Typography>
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
                        引っ越し先登録ページに移動
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
                                            enqueueSnackbar(
                                                `登録が完了していないようです。検出された所属: ${e.content.domain}`,
                                                {
                                                    variant: 'error'
                                                }
                                            )
                                        }
                                    })
                            }}
                        >
                            確認して次へ
                        </Button>
                    </Box>
                </Box>
            )
        },
        {
            label: '現住所からレポジトリデータをダウンロード',
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
                            次へ
                        </Button>
                    </Box>
                </>
            )
        },
        {
            label: '移行先にレポジトリデータをアップロード',
            content: (
                <>
                    <Typography>実際にすべてのデータが読み込まれるまで時間がかかる場合があります。</Typography>
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
                            次へ
                        </Button>
                    </Box>
                </>
            )
        },
        {
            label: '移行先に設定をコピー',
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
                                        enqueueSnackbar('エラーが発生しました。', { variant: 'error' })
                                    })
                            })
                        }}
                    >
                        実行
                    </Button>
                </>
            ),
            ok: () => imported
        },
        {
            label: '現住所にデータ削除依頼を送信',
            content: (
                <>
                    <Typography>
                        猶予を7日で作成するので、問題が発生した場合は削除リクエストをキャンセルすることができます。
                    </Typography>
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
                        削除リクエストを送信
                    </Button>
                </>
            ),
            ok: () => false
        },
        {
            label: '引っ越し完了!',
            content: (
                <Button
                    onClick={() => {
                        if (!destinationDomain) return
                        client.api.invalidateEntity(client.ccid!)
                        localStorage.setItem('Domain', JSON.stringify(destinationDomain.fqdn))
                        window.location.href = '/'
                    }}
                >
                    リロードして完了させる
                </Button>
            )
        }
    ]

    if (client.ckid)
        return (
            <>
                <Typography>引っ越しは重要なアカウント操作のため、マスターキーでのログインが必要です。</Typography>
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
