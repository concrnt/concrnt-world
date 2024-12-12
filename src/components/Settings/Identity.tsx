import {
    Alert,
    Box,
    Menu,
    MenuItem,
    Switch,
    FormGroup,
    FormControlLabel,
    Typography,
    TextField,
    Button,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Dialog,
    DialogContent,
    DialogTitle,
    DialogContentText,
    useTheme,
    AlertTitle
} from '@mui/material'
import Tilt from 'react-parallax-tilt'
import { Passport } from '../theming/Passport'
import { useEffect, useMemo, useState } from 'react'
import { useClient } from '../../context/ClientContext'
import { type Key } from '@concurrent-world/client/dist/types/model/core'
import { usePreference } from '../../context/PreferenceContext'
import { useTranslation } from 'react-i18next'
import { Codeblock } from '../ui/Codeblock'

import { KeyCard } from '../ui/KeyCard'
import { Sign, type Identity } from '@concurrent-world/client'
import { enqueueSnackbar } from 'notistack'
import { useGlobalState } from '../../context/GlobalState'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Node, type NodeProps } from '../ui/TreeGraph'
import { type ConcurrentTheme } from '../../model'
import { CCIconButton } from '../ui/CCIconButton'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'

interface CertChain {
    id: string
    key?: Key
    children: CertChain[]
}

interface KeyTreeNodeProps extends Omit<NodeProps, 'content'> {
    certChain: CertChain
    currentKey?: string
    onMenuClick: (event: React.MouseEvent<HTMLButtonElement>, key: Key) => void
}

const KeyTreeNode = (props: KeyTreeNodeProps): JSX.Element => {
    return (
        <Node
            depth={props.depth}
            nodeposition={props.nodeposition}
            content={
                <Box
                    sx={{
                        display: 'flex',
                        gap: 1
                    }}
                >
                    <Box
                        sx={{
                            width: '300px'
                        }}
                    >
                        <KeyCard
                            item={props.certChain.key!}
                            selected={props.certChain.key?.id === props.currentKey}
                            onMenuClick={props.onMenuClick}
                            subText={props.certChain.key?.id === props.currentKey ? 'Using' : undefined}
                        />
                    </Box>
                </Box>
            }
            nodeStyle={props.nodeStyle}
        >
            {props.certChain.children.map((child) => (
                <KeyTreeNode
                    key={child.id}
                    certChain={child}
                    onMenuClick={props.onMenuClick}
                    currentKey={props.currentKey}
                />
            ))}
        </Node>
    )
}

export interface KeyTreeProps {
    certChain: CertChain
    forceUpdateCallback?: () => void
}

export const KeyTree = (props: KeyTreeProps): JSX.Element => {
    const { client } = useClient()
    const theme = useTheme<ConcurrentTheme>()
    const { t } = useTranslation('', { keyPrefix: 'settings.identity' })

    const key: Key = props.certChain.key ?? {
        id: props.certChain.id,
        root: props.certChain.id,
        parent: 'cck1null',
        enactDocument: 'null',
        enactSignature: 'null',
        validSince: 'null',
        validUntil: 'null'
    }

    const currentKey = client.api.ckid ?? client.api.ccid

    const [target, setTarget] = useState<string | null>(null)
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const [deactivateTarget, setDeactivateTarget] = useState<string | null>(null)

    return (
        <>
            <Node
                content={
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1
                        }}
                    >
                        <Box
                            sx={{
                                width: '300px'
                            }}
                        >
                            <KeyCard item={key} />
                        </Box>
                    </Box>
                }
                nodeStyle={{
                    nodeGap: '15px',
                    nodeBorderWidth: '2px',
                    nodeBorderColor: theme.palette.primary.main
                }}
            >
                {props.certChain.children.map((child) => (
                    <KeyTreeNode
                        currentKey={currentKey}
                        key={child.id}
                        certChain={child}
                        onMenuClick={(event, key) => {
                            setTarget(key.id)
                            setAnchorEl(event.currentTarget)
                        }}
                    />
                ))}
            </Node>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => {
                    setAnchorEl(null)
                }}
            >
                <MenuItem
                    onClick={() => {
                        setDeactivateTarget(target)
                    }}
                >
                    {t('deactivate')}
                </MenuItem>
            </Menu>
            <Dialog
                open={deactivateTarget !== null}
                onClose={() => {
                    setDeactivateTarget(null)
                }}
            >
                <DialogTitle>本当に無効化しますか？</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        サブキーを無効化すると、このサブキーでログインしている端末はログアウトされます。
                    </DialogContentText>
                    <Button
                        color="error"
                        fullWidth
                        onClick={() => {
                            if (deactivateTarget === null) {
                                return
                            }
                            client.api.revokeSubkey(deactivateTarget).then(() => {
                                setTarget(null)
                                setAnchorEl(null)
                                props.forceUpdateCallback?.()
                            })
                            setDeactivateTarget(null)
                        }}
                    >
                        {t('deactivate')}
                    </Button>
                </DialogContent>
            </Dialog>
        </>
    )
}

export const IdentitySettings = (): JSX.Element => {
    const { client } = useClient()
    const globalState = useGlobalState()
    const identity: Identity = JSON.parse(localStorage.getItem('Identity') || 'null')

    const [hideDisabledSubKey, setHideDisabledSubKey] = usePreference('hideDisabledSubKey')
    const [aliasDraft, setAliasDraft] = useState<string>('')
    const [certChain, setCertChain] = useState<CertChain | null>(null)
    const [devMode] = usePreference('devMode')

    const subkey = client.api.ckid
    const [forceUpdate, setForceUpdate] = useState(0)
    const forceUpdateCallback = (): void => {
        setForceUpdate(forceUpdate + 1)
    }

    const { t } = useTranslation('', { keyPrefix: 'settings.identity' })

    const signature = useMemo(() => {
        if (!client.keyPair?.privatekey) {
            return ''
        }
        return Sign(client.keyPair.privatekey, aliasDraft)
    }, [aliasDraft])

    useEffect(() => {
        client.api.getKeyList().then((res) => {
            const certChain: CertChain = {
                id: client.ccid!,
                children: []
            }

            if (hideDisabledSubKey) {
                res = res.filter((key) => !key.revokeDocument)
            }

            const findChildren = (root: CertChain, id: string): CertChain | null => {
                if (root.id === id) {
                    return root
                }
                for (const child of root.children) {
                    const result = findChildren(child, id)
                    if (result) {
                        return result
                    }
                }
                return null
            }

            const pool: Key[] = JSON.parse(JSON.stringify(res))
            let attemptsRemaining = 1000 // for safety
            while (pool.length > 0) {
                const key = pool.shift()!
                if (key.parent) {
                    const parent = findChildren(certChain, key.parent)
                    if (parent) {
                        parent.children.push({
                            id: key.id,
                            key,
                            children: []
                        })
                    } else {
                        pool.push(key)
                    }
                }
                if (attemptsRemaining-- <= 0) {
                    console.error('infinite loop detected')
                    break
                }
            }
            setCertChain(certChain)
        })
    }, [forceUpdate, hideDisabledSubKey])

    const toggleHideDisabledSubKey = (): void => {
        setHideDisabledSubKey(!hideDisabledSubKey)
    }

    return (
        <>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1
                }}
            >
                <Box
                    sx={{
                        padding: { xs: '10px', sm: '10px 50px' }
                    }}
                >
                    <Tilt glareEnable={true} glareBorderRadius="5%">
                        <Passport />
                    </Tilt>
                </Box>

                <Accordion>
                    <AccordionSummary
                        expandIcon={
                            <ExpandMoreIcon
                                sx={{
                                    color: 'text.primary'
                                }}
                            />
                        }
                    >
                        {client.user?.alias ? (
                            <Typography variant="body1">
                                アカウントにはエイリアス{client.user.alias}が設定されています。
                            </Typography>
                        ) : (
                            <Typography variant="body1">アカウントエイリアス未設定 (特権モードのみ設定可能)</Typography>
                        )}
                    </AccordionSummary>
                    <AccordionDetails
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1
                        }}
                    >
                        {globalState.isMasterSession ? (
                            <>
                                <Typography gutterBottom>
                                    ドメインをお持ちの場合、以下のtxtレコードを作成することで自身のアカウントにエイリアスを設定できます。
                                </Typography>

                                <TextField
                                    fullWidth
                                    label="設定したいドメイン"
                                    value={aliasDraft}
                                    onChange={(e) => {
                                        setAliasDraft(e.target.value)
                                    }}
                                />

                                <Codeblock language="js">{`_concrnt.${aliasDraft} TXT "ccid=${client.ccid}"
_concrnt.${aliasDraft} TXT "sig=${signature}"
_concrnt.${aliasDraft} TXT "hint=${client.host}"`}</Codeblock>
                                <Button
                                    fullWidth
                                    onClick={() => {
                                        fetch(`https://${client.host}/api/v1/entity/${aliasDraft}`)
                                            .then(async (res) => {
                                                const resjson = await res.json()
                                                if (resjson.content.alias) {
                                                    enqueueSnackbar('検証成功', { variant: 'success' })
                                                } else {
                                                    enqueueSnackbar('検証に失敗しました。', { variant: 'error' })
                                                }
                                            })
                                            .catch((e) => {
                                                console.error(e)
                                                enqueueSnackbar('検証に失敗しました。', { variant: 'error' })
                                            })
                                    }}
                                >
                                    設定を検証
                                </Button>
                            </>
                        ) : (
                            <Typography>マスターキーログイン時のみエイリアス設定が可能です。</Typography>
                        )}
                    </AccordionDetails>
                </Accordion>

                {devMode && identity && (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1
                        }}
                    >
                        <Alert
                            severity="info"
                            action={
                                <CCIconButton
                                    onClick={() => {
                                        navigator.clipboard.writeText(client.api.privatekey ?? '')
                                        enqueueSnackbar('Copied', { variant: 'info' })
                                    }}
                                >
                                    <ContentPasteIcon />
                                </CCIconButton>
                            }
                        >
                            <AlertTitle>[開発者用] hex形式のマスターキー</AlertTitle>
                            マスターキーのプライベートキーをbot等で利用する場合、ここからコピーできます。
                        </Alert>
                    </Box>
                )}

                {subkey && (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1
                        }}
                    >
                        <Alert
                            severity="info"
                            action={
                                <CCIconButton
                                    onClick={() => {
                                        try {
                                            navigator.clipboard.writeText(JSON.parse(localStorage.getItem('SubKey')!))
                                            enqueueSnackbar('Copied', { variant: 'info' })
                                        } catch (e) {
                                            enqueueSnackbar('No SubKey found', { variant: 'error' })
                                        }
                                    }}
                                >
                                    <ContentPasteIcon />
                                </CCIconButton>
                            }
                        >
                            <AlertTitle>{t('loginType.subKey')}</AlertTitle>
                            右のボタンからサブキーをコピーできますが、サブキーはパスワードと同じく機密情報なので扱いには注意してください。
                        </Alert>
                    </Box>
                )}

                {!subkey && !identity && <Alert severity="error">{t('loginType.secret')}</Alert>}

                <Box
                    sx={{
                        padding: { sm: '10px 10px' }
                    }}
                >
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Switch size="small" checked={hideDisabledSubKey} onChange={toggleHideDisabledSubKey} />
                            }
                            label={t('hideSubKey')}
                        />
                    </FormGroup>
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        overflow: 'scroll'
                    }}
                >
                    <Typography variant="h3">セッション情報</Typography>
                    {certChain && <KeyTree certChain={certChain} forceUpdateCallback={forceUpdateCallback} />}
                </Box>
            </Box>
        </>
    )
}
