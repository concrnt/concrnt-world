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
import { usePreference } from '../../context/PreferenceContext'
import { useTranslation } from 'react-i18next'
import { Codeblock } from '../ui/Codeblock'

import { KeyCard } from '../ui/KeyCard'
import { Sign, type Identity, Key, MasterKeyAuthProvider } from '@concrnt/client'
import { enqueueSnackbar } from 'notistack'
import { useGlobalState } from '../../context/GlobalState'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Node, type NodeProps } from '../ui/TreeGraph'
import { JobRequest, type ConcurrentTheme } from '../../model'
import { CCIconButton } from '../ui/CCIconButton'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'
import { EntityMetaEditor } from '../EntityMetaEditor'
import { useConfirm } from '../../context/Confirm'

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

    const keyBase: Omit<Key, 'parsedEnactDoc' | 'parsedRevokeDoc'> = props.certChain.key ?? {
        id: props.certChain.id,
        root: props.certChain.id,
        parent: 'cck1null',
        enactDocument: 'null',
        enactSignature: 'null',
        validSince: 'null',
        validUntil: 'null'
    }

    const key = Object.setPrototypeOf(keyBase, Key.prototype)

    const currentKey = client.ckid ?? client.ccid

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
                <DialogTitle>{t('deactivateConfirm')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{t('deactivateDesc')}</DialogContentText>
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
    const { isMasterSession } = useGlobalState()
    const identity: Identity = JSON.parse(localStorage.getItem('Identity') || 'null')

    const [hideDisabledSubKey, setHideDisabledSubKey] = usePreference('hideDisabledSubKey')
    const [aliasDraft, setAliasDraft] = useState<string>('')
    const [certChain, setCertChain] = useState<CertChain | null>(null)
    const [devMode] = usePreference('devMode')

    const subkey = client.ckid
    const [forceUpdate, setForceUpdate] = useState(0)
    const forceUpdateCallback = (): void => {
        setForceUpdate(forceUpdate + 1)
    }

    const confirm = useConfirm()

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

                <Accordion disableGutters>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} disabled={!isMasterSession}>
                        {client.user?.alias ? (
                            <Typography variant="body1">
                                {t('alias.completed', { alias: client.user.alias })}
                            </Typography>
                        ) : (
                            <Typography variant="body1">{t('alias.uncompleted')}</Typography>
                        )}
                    </AccordionSummary>
                    <AccordionDetails
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1
                        }}
                    >
                        <Typography gutterBottom>{t('alias.description')}</Typography>

                        <TextField
                            fullWidth
                            label={t('alias.domainToSet')}
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
                                            enqueueSnackbar(t('alias.verifySuccess'), { variant: 'success' })
                                        } else {
                                            enqueueSnackbar(t('alias.verifyFailed'), { variant: 'error' })
                                        }
                                    })
                                    .catch((e) => {
                                        console.error(e)
                                        enqueueSnackbar(t('alias.verifyFailed'), { variant: 'error' })
                                    })
                            }}
                        >
                            {t('alias.verify')}
                        </Button>
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
                                        const authProvider = client.api.authProvider as MasterKeyAuthProvider
                                        navigator.clipboard.writeText(authProvider.privatekey)
                                        enqueueSnackbar('Copied', { variant: 'info' })
                                    }}
                                >
                                    <ContentPasteIcon />
                                </CCIconButton>
                            }
                        >
                            <AlertTitle>{t('devkeyTitle')}</AlertTitle>
                            {t('devkeyDesc')}
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
                            {t('copySubkeyDesc')}
                        </Alert>
                    </Box>
                )}

                {!subkey && !identity && <Alert severity="error">{t('loginType.secret')}</Alert>}

                <Accordion disableGutters slotProps={{ transition: { unmountOnExit: true } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="body1">{t('registrationInfo', { fqdn: client.host })}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <EntityMetaEditor />
                    </AccordionDetails>
                </Accordion>

                <Accordion disableGutters>
                    <AccordionSummary expandIcon={<ExpandMoreIcon color="error" />}>
                        <Typography variant="h4" color="error">
                            Danger Zone
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Button
                            color="error"
                            onClick={() => {
                                confirm.open(
                                    t('deleteConfirm'),
                                    () => {
                                        const job: JobRequest = {
                                            type: 'clean',
                                            payload: '{}',
                                            scheduled: new Date(Date.now()).toISOString()
                                        }

                                        client?.api
                                            .fetchWithCredential(client.host, '/api/v1/jobs', {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json'
                                                },
                                                body: JSON.stringify(job)
                                            })
                                            .then(async (res) => {
                                                enqueueSnackbar(t('deleteRequested'), {
                                                    variant: 'success'
                                                })
                                            })
                                    },
                                    {
                                        confirmText: t('delete'),
                                        description: t('deleteDescription')
                                    }
                                )
                            }}
                        >
                            {t('deleteAccount')}
                        </Button>
                    </AccordionDetails>
                </Accordion>

                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        overflow: 'scroll'
                    }}
                >
                    <Typography variant="h3">{t('sessionInfo')}</Typography>
                    <Box
                        sx={{
                            px: 1
                        }}
                    >
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Switch
                                        size="small"
                                        checked={hideDisabledSubKey}
                                        onChange={toggleHideDisabledSubKey}
                                    />
                                }
                                label={t('hideSubKey')}
                            />
                        </FormGroup>
                    </Box>
                    {certChain && <KeyTree certChain={certChain} forceUpdateCallback={forceUpdateCallback} />}
                </Box>
            </Box>
        </>
    )
}
