import { useEffect, useRef, useState } from 'react'
import { useClient } from '../context/ClientContext'
import { Accordion, AccordionSummary, Alert, Box, Button, TextField } from '@mui/material'
import { useSnackbar } from 'notistack'
import { Codeblock } from './ui/Codeblock'

const status = {
    idle: 'レポジトリデータのインポート',
    loading: 'インポート中(時間がかかります)',
    success: 'インポート完了！',
    error: 'インポートに失敗しました(consoleログを確認してください)'
}

export function RepositoryImportButton(props: {
    source?: string
    domain?: string
    onImport?: (err: string) => void
}): JSX.Element {
    const { client } = useClient()

    const fileInputRef = useRef<HTMLInputElement>(null)
    const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [sourceDomain, setSourceDomain] = useState<string>(props.source ?? '')
    const [progress, setProgress] = useState<string>('')

    const [importLog, setImportLog] = useState<string>('')

    const target = props.domain ?? client.host

    const importRepo = async (data: string): Promise<void> => {
        if (importStatus !== 'idle') return

        setImportStatus('loading')

        const lines = data.split('\n')
        const chunks = []
        let chunk = ''
        lines.forEach((line, index) => {
            chunk += line + '\n'
            if ((index + 1) % 100 === 0) {
                chunks.push(chunk)
                chunk = ''
            }
        })

        if (chunk.length > 0) {
            chunks.push(chunk)
        }

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i]
            await client.api
                .fetchWithCredential(
                    target,
                    '/api/v1/repository?from=' + sourceDomain,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'text/plain'
                        },
                        body: chunk
                    }
                    // 1000 * 60 * 10 // 10 minutes // TODO
                )
                .then((data) => {
                    setProgress(`imported ${i}/${chunks.length}`)
                    setImportLog((prev) => prev + '\n' + JSON.stringify(data, null, 2))
                })
                .catch((e) => {
                    console.error(e)
                    setImportStatus('error')
                    props.onImport?.(`failed to import: ${e}`)
                })
        }

        console.log('imported')
        setImportStatus('success')
        props.onImport?.('')
    }

    return (
        <>
            <input
                hidden
                type="file"
                accept=".txt"
                ref={fileInputRef}
                onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                        const reader = new FileReader()
                        reader.onload = (e) => {
                            const contents = e.target?.result
                            if (contents) {
                                importRepo(contents as string)
                            }
                        }
                        reader.readAsText(file)
                    }
                }}
            />
            <TextField
                label="インポート元ドメイン(オプション)"
                placeholder="example.com"
                value={sourceDomain}
                onChange={(e) => {
                    setSourceDomain(e.target.value)
                }}
            />
            <Button
                disabled={importStatus === 'loading'}
                color={importStatus === 'error' ? 'error' : importStatus === 'success' ? 'success' : 'primary'}
                onClick={() => {
                    fileInputRef.current?.click()
                }}
            >
                {status[importStatus] + (importStatus === 'loading' ? `(${progress})` : '')}
            </Button>
            {importLog && (
                <Accordion>
                    <AccordionSummary>インポートログ</AccordionSummary>
                    <Codeblock language="json">{importLog}</Codeblock>
                </Accordion>
            )}
        </>
    )
}

export function RepositoryExportButton(): JSX.Element {
    const { client } = useClient()
    const { enqueueSnackbar } = useSnackbar()
    const [syncStatus, setSyncStatus] = useState<any>(null)

    useEffect(() => {
        if (!client.user) return

        client.api.fetchWithCredential(client.host, '/api/v1/repositories/sync', {}).then((data) => {
            setSyncStatus(data.content)
        })
    }, [])

    const isDateValid = syncStatus && new Date(syncStatus?.latestOnFile).getTime() > 0

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2
            }}
        >
            {syncStatus?.status === 'syncing' && (
                <Alert
                    severity="info"
                    action={
                        <Button
                            variant="contained"
                            onClick={() =>
                                client.api
                                    .fetchWithCredential(client.host, '/api/v1/repositories/sync', {})
                                    .then((data) => {
                                        setSyncStatus(data.content)
                                    })
                            }
                        >
                            リロード
                        </Button>
                    }
                >
                    バックアップデータは現在同期中です。しばらくお待ちください。({syncStatus?.progress})
                </Alert>
            )}
            {syncStatus?.status === 'insync' && (
                <Alert severity="success">最新のバックアップデータがダウンロード可能です。</Alert>
            )}
            {syncStatus?.status === 'outofsync' && (
                <Alert
                    severity="info"
                    action={
                        <Button
                            variant="contained"
                            onClick={() =>
                                client.api
                                    .fetchWithCredential(client.host, '/api/v1/repositories/sync', {
                                        method: 'POST'
                                    })
                                    .then((data) => {
                                        console.log(data)
                                        setSyncStatus(data)
                                        enqueueSnackbar('更新をリクエストしました。しばらくお待ちください。', {
                                            variant: 'info'
                                        })
                                    })
                            }
                        >
                            更新をリクエスト
                        </Button>
                    }
                >
                    {isDateValid ? (
                        <>
                            現在ダウンロードできるバックアップデータは
                            {new Date(syncStatus?.latestOnFile).toLocaleDateString()}-
                            {new Date(syncStatus?.latestOnFile).toLocaleTimeString()}までのデータです。
                        </>
                    ) : (
                        <>バックアップデータが未作成です。更新をリクエストしてください。</>
                    )}
                </Alert>
            )}

            <Button
                disabled={syncStatus?.status === 'syncing' || !isDateValid}
                onClick={() => {
                    client.api.fetchWithCredentialBlob(client.host, '/api/v1/repository', {}).then((blob) => {
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download =
                            (client.user?.profile?.username ?? 'anonymous') +
                            '-backup-' +
                            new Date().toLocaleDateString() +
                            '.txt'
                        a.click()
                        window.URL.revokeObjectURL(url)
                    })
                }}
            >
                {!isDateValid
                    ? 'バックアップデータのエクスポート'
                    : syncStatus?.status === 'syncing'
                      ? '準備中...'
                      : syncStatus?.status === 'insync'
                        ? 'バックアップデータのエクスポート'
                        : `${new Date(syncStatus?.latestOnFile).toLocaleDateString()}-${new Date(
                              syncStatus?.latestOnFile
                          ).toLocaleTimeString()}までのレポジトリデータをエクスポート`}
            </Button>
        </Box>
    )
}
