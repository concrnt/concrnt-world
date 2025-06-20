import { Box, Button, Grid, MenuItem, Modal, Paper, Select, TextField, Typography } from '@mui/material'
import { useClient } from '../context/ClientContext'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ComputeCKID, type Identity, GenerateIdentity } from '@concrnt/client'
import { Trans, useTranslation } from 'react-i18next'
import EmailIcon from '@mui/icons-material/Email'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'
import html2canvas from 'html2canvas'
import JsPDF, { GState } from 'jspdf'
import ccPaper from '../resources/cc-paper.svg'
import SwitchMasterToPasskey from './SwitchMasterToPasskey'

export interface SwitchMasterToSubProps {
    identity: Identity
    mode?: 'test' | 'memo'
}

export default function SwitchMasterToSub(props: SwitchMasterToSubProps): JSX.Element {
    const { client } = useClient()
    const [processing, setProcessing] = useState(false)

    const [ownMode, setMode] = useState<'test' | 'memo'>('test')
    const mode = props.mode ?? ownMode

    const { t, i18n } = useTranslation('', { keyPrefix: 'settings.identity.switchMasterToSub' })

    const [keyFormat, setKeyFormat] = useState<'ja' | 'en'>(i18n.language === 'ja' ? 'ja' : 'en')

    const [openPasskeyModal, setOpenPasskeyModal] = useState<boolean>(false)

    const mnemonic = useMemo(() => {
        if (keyFormat === 'ja') {
            return props.identity.mnemonic_ja
        } else {
            return props.identity.mnemonic
        }
    }, [props.identity, keyFormat])

    const ref = useRef<HTMLDivElement>(null)

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            {props.mode === undefined && (
                <Box display="flex" flexDirection="row" gap={1} alignItems="center" justifyContent="flex-end">
                    {mode === 'test' && (
                        <Button
                            variant="text"
                            onClick={() => {
                                setMode('memo')
                            }}
                        >
                            {t('checkMasterKey')}
                        </Button>
                    )}
                    {mode === 'memo' && (
                        <Button
                            variant="text"
                            onClick={() => {
                                setMode('test')
                            }}
                        >
                            {t('backToSwitch')}
                        </Button>
                    )}
                </Box>
            )}

            {mode === 'memo' && (
                <>
                    <Box display="flex" gap={1} flexDirection="column">
                        <Box display="flex" alignItems="center" flexDirection="row" gap={1}>
                            <Typography>{t('masterKeyFormat')}</Typography>
                            <Select
                                value={keyFormat}
                                onChange={(e) => {
                                    setKeyFormat(e.target.value as 'ja' | 'en')
                                }}
                                size="small"
                            >
                                <MenuItem value="ja">日本語</MenuItem>
                                <MenuItem value="en">English</MenuItem>
                            </Select>
                        </Box>
                        <Button
                            fullWidth
                            component="a"
                            target="_blank"
                            href={t('mailHerf', { ccid: client?.ccid, mnemonic })}
                            startIcon={<EmailIcon />}
                        >
                            {t('sendEmail')}
                        </Button>
                        <Button
                            fullWidth
                            onClick={() => {
                                html2canvas(ref.current as HTMLElement).then(async (canvas) => {
                                    const url = canvas.toDataURL('image/png', 2.0)

                                    if (keyFormat == 'ja') {
                                        // @ts-ignore
                                        await import('../resources/mplus1p-hiragana-normal')
                                    }

                                    const pdf = new JsPDF('p', 'mm', 'a4')
                                    pdf.addImage(url, 'svg', 0, 0, 210, 297)

                                    if (keyFormat == 'ja') {
                                        pdf.setFont('mplus1p-hiragana')
                                    }

                                    const m = mnemonic.normalize('NFC').split(' ')

                                    pdf.setGState(new GState({ opacity: 0.0 }))
                                    pdf.text(m[0], 75, 79, { align: 'center' })
                                    pdf.text(m[1], 125, 79, { align: 'center' })
                                    pdf.text(m[2], 175, 79, { align: 'center' })
                                    pdf.text(m[3], 75, 92, { align: 'center' })
                                    pdf.text(m[4], 125, 92, { align: 'center' })
                                    pdf.text(m[5], 175, 92, { align: 'center' })
                                    pdf.text(m[6], 75, 105, { align: 'center' })
                                    pdf.text(m[7], 125, 105, { align: 'center' })
                                    pdf.text(m[8], 175, 105, { align: 'center' })
                                    pdf.text(m[9], 75, 118, { align: 'center' })
                                    pdf.text(m[10], 125, 118, { align: 'center' })
                                    pdf.text(m[11], 175, 118, { align: 'center' })

                                    pdf.save('concrnt_master_key.pdf')
                                })
                            }}
                            startIcon={<FileDownloadIcon />}
                        >
                            {t('downloadPDF')}
                        </Button>
                        <Button
                            fullWidth
                            onClick={() => {
                                navigator.clipboard.writeText(mnemonic.normalize('NFC'))
                            }}
                            startIcon={<ContentPasteIcon />}
                        >
                            {t('copyToClipboard')}
                        </Button>
                    </Box>

                    <Box
                        sx={{
                            width: '0px',
                            height: '0px',
                            overflow: 'hidden'
                        }}
                    >
                        <div
                            ref={ref}
                            style={{
                                width: '210mm',
                                height: '297mm',
                                border: '1px solid black',
                                position: 'relative',
                                color: 'black',
                                fontFamily: 'serif'
                            }}
                        >
                            <img
                                src={ccPaper}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    position: 'absolute',
                                    top: '0',
                                    left: '0'
                                }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '10%',
                                    left: '50%',
                                    fontSize: '48px',
                                    color: 'black',
                                    textAlign: 'center',
                                    transform: 'translate(-50%, 0%)'
                                }}
                            >
                                {t('identification')}
                            </div>

                            <div
                                style={{
                                    position: 'absolute',
                                    top: '5mm',
                                    right: '5mm',
                                    fontSize: '7mm',
                                    color: 'black',
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    border: '3px solid black',
                                    padding: '5px',
                                    borderRadius: '5px'
                                }}
                            >
                                {t('confidential')}
                            </div>

                            <Box
                                style={{
                                    position: 'absolute',
                                    top: '20%',
                                    left: '50%',
                                    fontSize: '20px',
                                    color: 'black',
                                    textAlign: 'center',
                                    transform: 'translate(-50%, 0%)',
                                    width: '90%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px'
                                }}
                            >
                                <table
                                    style={{
                                        width: '100%',
                                        borderCollapse: 'collapse',
                                        borderSpacing: '0',
                                        border: '1px solid black'
                                    }}
                                >
                                    <tr>
                                        <td
                                            style={{
                                                border: '1px solid black',
                                                padding: '5px',
                                                textAlign: 'center'
                                            }}
                                        >
                                            {t('identifier')}
                                        </td>
                                        <td
                                            style={{
                                                border: '1px solid black',
                                                padding: '5px',
                                                textAlign: 'left'
                                            }}
                                        >
                                            {client?.ccid ?? t('undifined')}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td
                                            style={{
                                                border: '1px solid black',
                                                padding: '5px',
                                                textAlign: 'center',
                                                wordBreak: 'keep-all'
                                            }}
                                        >
                                            {t('masterKey')}
                                        </td>
                                        <td
                                            style={{
                                                border: '1px solid black',
                                                padding: '5px',
                                                textAlign: 'left'
                                            }}
                                        >
                                            <Box
                                                component={Grid}
                                                style={{
                                                    overflow: 'hidden',
                                                    width: '100%'
                                                }}
                                                spacing={1}
                                                columns={3}
                                                container
                                            >
                                                {mnemonic.split(' ').map((e: string, i: number) => (
                                                    <Grid
                                                        key={i}
                                                        item
                                                        xs={1}
                                                        sm={1}
                                                        md={1}
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '5px',
                                                            padding: '3px'
                                                        }}
                                                    >
                                                        {i + 1}:
                                                        <Box
                                                            sx={{
                                                                display: 'inline-block',
                                                                padding: '3px',
                                                                width: '100%',
                                                                textAlign: 'center',
                                                                border: '1px solid black',
                                                                borderRadius: '5px'
                                                            }}
                                                        >
                                                            {e}
                                                        </Box>
                                                    </Grid>
                                                ))}
                                            </Box>
                                        </td>
                                    </tr>
                                </table>
                            </Box>

                            <div
                                style={{
                                    position: 'absolute',
                                    top: '85%',
                                    left: '50%',
                                    fontSize: '13px',
                                    transform: 'translate(-50%, -50%)',
                                    width: '90%'
                                }}
                            >
                                <Trans i18nKey={'settings.identity.switchMasterToSub.aboutMasterKey'} />
                            </div>

                            <div
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '5%',
                                    fontSize: '15px',
                                    fontFamily: 'serif',
                                    color: 'black',
                                    width: '90%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px'
                                }}
                            >
                                <div
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        fontSize: '20px',
                                        fontWeight: 'bold',
                                        fontFamily: 'serif'
                                    }}
                                >
                                    {t('reference')}
                                </div>
                                <table
                                    style={{
                                        width: '100%',
                                        borderCollapse: 'collapse',
                                        borderSpacing: '0',
                                        border: '1px solid black'
                                    }}
                                >
                                    <tr>
                                        <td
                                            style={{
                                                border: '1px solid black',
                                                padding: '5px',
                                                textAlign: 'center'
                                            }}
                                        >
                                            {t('name')}
                                        </td>
                                        <td
                                            style={{
                                                border: '1px solid black',
                                                padding: '5px',
                                                textAlign: 'left'
                                            }}
                                        >
                                            {client?.user?.profile?.username ?? t('unset')}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td
                                            style={{
                                                border: '1px solid black',
                                                padding: '5px',
                                                textAlign: 'center'
                                            }}
                                        >
                                            {t('domain')}
                                        </td>
                                        <td
                                            style={{
                                                border: '1px solid black',
                                                padding: '5px',
                                                textAlign: 'left'
                                            }}
                                        >
                                            {client?.host}
                                        </td>
                                    </tr>
                                </table>
                                <div>{t('addition')}</div>
                            </div>

                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: '4%',
                                    right: '5%',
                                    fontSize: '15px',
                                    fontFamily: 'serif',
                                    color: 'black',
                                    textAlign: 'center'
                                }}
                            >
                                {t('date')} {new Date().toLocaleDateString()}
                            </div>
                        </div>
                    </Box>
                </>
            )}
            {mode === 'test' && (
                <>
                    <TestMasterkey identity={props.identity}>
                        {(testOK) => (
                            <Box display="flex" gap={1} sx={{ width: '100%' }}>
                                <Button
                                    fullWidth
                                    disabled={processing || !testOK}
                                    onClick={() => {
                                        setProcessing(true)

                                        const newIdentity = GenerateIdentity()

                                        const ckid = ComputeCKID(newIdentity.publicKey)

                                        client.api
                                            .enactSubkey(ckid)
                                            .then(() => {
                                                const subkey = `concurrent-subkey ${newIdentity.privateKey} ${client.ccid}@${client.host} ${client.user?.profile?.username}`
                                                localStorage.setItem('SubKey', JSON.stringify(subkey))
                                                localStorage.removeItem('Identity')
                                                localStorage.removeItem('PrivateKey')
                                                window.location.reload()
                                            })
                                            .catch((e) => {
                                                console.error('error: ', e)
                                            })
                                    }}
                                >
                                    {processing ? t('processing') : t('switchToNormalMode')}
                                </Button>
                                <Button
                                    fullWidth
                                    disabled={processing || !testOK}
                                    onClick={() => {
                                        setOpenPasskeyModal(true)
                                    }}
                                >
                                    パスキーに切り替える(ベータ)
                                </Button>
                            </Box>
                        )}
                    </TestMasterkey>
                    <Modal open={openPasskeyModal} onClose={() => setOpenPasskeyModal(false)}>
                        <Paper
                            sx={{
                                position: 'absolute',
                                top: '10%',
                                left: '50%',
                                transform: 'translate(-50%, 0%)',
                                width: '700px',
                                maxWidth: '90vw',
                                maxHeight: '80vh',
                                overflowY: 'auto',
                                padding: 2
                            }}
                        >
                            <SwitchMasterToPasskey />
                        </Paper>
                    </Modal>
                </>
            )}
        </Box>
    )
}

export interface TestMasterkeyProps {
    identity: Identity
    children?: (testOK: boolean) => JSX.Element
}

export const TestMasterkey = (props: TestMasterkeyProps): JSX.Element => {
    const [testIndex, setTestIndex] = useState<{ first: number; second: number }>({ first: 0, second: 0 })

    const [mnemonicTest1, setMnemonicTest1] = useState<string>('')
    const [mnemonicTest2, setMnemonicTest2] = useState<string>('')

    const testOK = useMemo(() => {
        const ok1 =
            mnemonicTest1 === props.identity.mnemonic.split(' ')[testIndex.first] ||
            mnemonicTest1 === props.identity.mnemonic_ja.split(' ')[testIndex.first]
        const ok2 =
            mnemonicTest2 === props.identity.mnemonic.split(' ')[testIndex.second] ||
            mnemonicTest2 === props.identity.mnemonic_ja.split(' ')[testIndex.second]
        return ok1 && ok2
    }, [props.identity, mnemonicTest1, mnemonicTest2])

    useEffect(() => {
        const first = Math.floor(Math.random() * 6)
        const second = Math.floor(Math.random() * 6 + 6)
        setTestIndex({ first, second })
    }, [])

    const { t } = useTranslation('', { keyPrefix: 'settings.identity.switchMasterToSub' })

    return (
        <>
            <Typography>{t('testPrompt', { first: testIndex.first + 1, second: testIndex.second + 1 })}</Typography>
            <Box display="flex" flexDirection="row" gap={1}>
                <TextField
                    fullWidth
                    variant="outlined"
                    label={t('nthWord', { nth: testIndex.first + 1 })}
                    onChange={(e) => {
                        setMnemonicTest1(e.target.value.normalize('NFKD').trim())
                    }}
                    error={
                        mnemonicTest1 !== '' &&
                        mnemonicTest1 !== props.identity.mnemonic.split(' ')[testIndex.first] &&
                        mnemonicTest1 !== props.identity.mnemonic_ja.split(' ')[testIndex.first]
                    }
                />
                <TextField
                    fullWidth
                    variant="outlined"
                    label={t('nthWord', { nth: testIndex.second + 1 })}
                    onChange={(e) => {
                        setMnemonicTest2(e.target.value.normalize('NFKD').trim())
                    }}
                    error={
                        mnemonicTest2 !== '' &&
                        mnemonicTest2 !== props.identity.mnemonic.split(' ')[testIndex.second] &&
                        mnemonicTest2 !== props.identity.mnemonic_ja.split(' ')[testIndex.second]
                    }
                />
            </Box>
            {props.children?.(testOK)}
        </>
    )
}
