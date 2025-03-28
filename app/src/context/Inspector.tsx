import { Alert, Box, IconButton, List, ListItem, Paper, Typography } from '@mui/material'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useClient } from './ClientContext'
import { ValidateSignature, type Message, type Association, type Key } from '@concrnt/client'
import { Codeblock } from '../components/ui/Codeblock'
import { MessageContainer } from '../components/Message/MessageContainer'
import { CCDrawer } from '../components/ui/CCDrawer'
import { KeyCard } from '../components/ui/KeyCard'
import { ListItemTimeline } from '../components/ui/ListItemTimeline'
import PlaylistRemoveIcon from '@mui/icons-material/PlaylistRemove'
import { useSnackbar } from 'notistack'
import cfm from '@concrnt/cfm'

export interface InspectorState {
    inspectingItem: { messageId: string; author: string } | null
    inspectItem: React.Dispatch<React.SetStateAction<{ messageId: string; author: string } | null>>
}

const InspectorContext = createContext<InspectorState | undefined>(undefined)

interface InspectorProps {
    children: JSX.Element | JSX.Element[]
}

export const InspectorProvider = (props: InspectorProps): JSX.Element => {
    const { client } = useClient()
    const { enqueueSnackbar } = useSnackbar()
    const [inspectingItem, inspectItem] = useState<{ messageId: string; author: string } | null>(null)
    const [message, setMessage] = useState<Message<any> | undefined>()
    const [associations, setAssociations] = useState<Array<Association<any>>>([])
    const [keyResolution, setKeyResolution] = useState<Key[]>([])
    const [ast, setAst] = useState<any>(null)

    useEffect(() => {
        if (!inspectingItem) return
        let isMounted = true

        client.api
            .getMessageWithAuthor<any>(inspectingItem.messageId, inspectingItem.author, undefined, {
                cache: 'no-cache'
            })
            .then((msg) => {
                if (!msg) return
                if (!isMounted) return
                setMessage(msg)

                try {
                    setAst(cfm.parse(msg.parsedDoc.body.body))
                } catch (e) {
                    console.error(e)
                }

                if (msg.parsedDoc.keyID && msg.parsedDoc.keyID !== '') {
                    client.api.getKeyResolution(msg.parsedDoc.keyID, inspectingItem.author).then((keys) => {
                        if (!isMounted) return
                        setKeyResolution(keys)
                    })
                }
            })

        client.api.getMessageAssociationsByTarget(inspectingItem.messageId, inspectingItem.author).then((assocs) => {
            if (!isMounted) return
            setAssociations(assocs)
        })

        return () => {
            isMounted = false
        }
    }, [inspectingItem])

    const signatureIsValid = useMemo(() => {
        if (message) {
            return ValidateSignature(
                message.document,
                message.signature,
                message.parsedDoc.keyID ?? message.parsedDoc.signer
            )
        }
        return false
    }, [message])

    const previewMessage = useMemo(() => {
        const msg: any = structuredClone(message)
        if (msg) {
            msg.associations = 'REDACTED'
            msg.ownAssociations = 'REDACTED'
        }
        return msg
    }, [message])

    const isSignedBySubkey = useMemo(() => {
        if (message) {
            return message.parsedDoc.keyID && message.parsedDoc.keyID !== ''
        }
        return false
    }, [message])

    const KeyResolutionSummary: { valid: boolean; reason?: string; since?: Date; until?: Date } = useMemo(() => {
        const rootkey = keyResolution[0]?.root
        if (!rootkey) {
            return {
                valid: true
            }
        }

        let previousKey: string | null = null

        let valid
        let reason
        let since
        let until

        for (let i = 0; i < keyResolution.length; i++) {
            const key = keyResolution[i]

            if (key.root !== rootkey) {
                valid = false
                reason = 'keychain has multiple roots'
                break
            }

            if (previousKey && key.id !== previousKey) {
                valid = false
                reason = 'keychain is not linear'
                break
            }

            if (!ValidateSignature(key.enactDocument, key.enactSignature, key.parent)) {
                valid = false
                reason = 'failed to validate enact signature of key ' + key.id
                break
            }
            if (!since || new Date(keyResolution[i].validSince) < since) {
                since = new Date(keyResolution[i].validSince)
            }

            if (key.revokeDocument?.startsWith('{') && key.revokeSignature) {
                try {
                    const obj = JSON.parse(key.revokeDocument)
                    if (ValidateSignature(key.revokeDocument, key.revokeSignature, obj.keyID ?? obj.signer)) {
                        if (!until || new Date(keyResolution[i].validUntil) > until) {
                            until = new Date(keyResolution[i].validUntil)
                        }
                    }
                } catch (e) {
                    valid = false
                    reason = 'failed to parse revoke document of key ' + key.id
                    break
                }
            }

            previousKey = keyResolution[i].parent
        }

        if (valid === undefined) {
            if (since && message && since > new Date(message.parsedDoc.signedAt)) {
                valid = false
                reason = 'keychain is not valid at the time of signing'
            } else if (until && message && until < new Date(message.parsedDoc.signedAt)) {
                valid = false
                reason = 'keychain is not valid at the time of signing'
            } else {
                valid = true
            }
        }

        return {
            valid,
            reason,
            since,
            until
        }
    }, [keyResolution])

    return (
        <InspectorContext.Provider
            value={useMemo(() => {
                return {
                    inspectingItem,
                    inspectItem
                }
            }, [])}
        >
            {props.children}
            <CCDrawer
                open={!!inspectingItem}
                onClose={() => {
                    inspectItem(null)
                }}
            >
                {inspectingItem && message ? (
                    <Box
                        sx={{
                            p: 1,
                            wordBreak: 'break-all',
                            whiteSpace: 'pre-wrap',
                            userSelect: 'text'
                        }}
                    >
                        <Typography variant="h1">Inspect</Typography>
                        <Paper sx={{ m: '10px 0', p: '0 20px' }} elevation={0} variant="outlined">
                            <MessageContainer messageID={message.id} messageOwner={message.author} />
                        </Paper>
                        <Typography variant="h2" sx={{ mt: 1 }}>
                            CheckSig:
                        </Typography>

                        {signatureIsValid ? (
                            isSignedBySubkey ? (
                                <Alert severity="success">
                                    Signature is valid!
                                    <br />
                                    With subkey:
                                    <br />
                                    {message.parsedDoc.keyID}
                                </Alert>
                            ) : (
                                <Alert severity="success">Signature is valid!</Alert>
                            )
                        ) : (
                            <Alert severity="error">Signature is invalid!</Alert>
                        )}

                        {isSignedBySubkey && (
                            <>
                                <Typography variant="h2" sx={{ mt: 1 }}>
                                    CheckKeyResolution:
                                </Typography>

                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 1
                                    }}
                                >
                                    {KeyResolutionSummary.valid ? (
                                        KeyResolutionSummary.until ? (
                                            <Alert severity="warning">
                                                Key resolution is valid at the time of signing, but signed key is
                                                currently revoked at {KeyResolutionSummary.until.toLocaleString()}
                                            </Alert>
                                        ) : (
                                            <Alert severity="success">Key resolution is valid!</Alert>
                                        )
                                    ) : (
                                        <Alert severity="error">
                                            Key resolution is invalid!
                                            <br />
                                            reason: {KeyResolutionSummary.reason}
                                        </Alert>
                                    )}
                                    <Typography variant="h2" sx={{ mt: 1 }}>
                                        UsedKeys:
                                    </Typography>
                                    <Box>
                                        {keyResolution.map((key) => (
                                            <Box key={key.id} maxWidth="300px" margin="0 auto">
                                                <KeyCard item={key} />
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            </>
                        )}

                        <Typography variant="h2" sx={{ mt: 1 }}>
                            Timelines:
                        </Typography>

                        <List>
                            {message.timelines.map((timeline) => (
                                <ListItem
                                    key={timeline}
                                    disablePadding
                                    secondaryAction={
                                        <IconButton
                                            onClick={(_) => {
                                                client.api
                                                    .retractItem(timeline, message.id)
                                                    .then(() => {
                                                        enqueueSnackbar('Retracted item from timeline', {
                                                            variant: 'success'
                                                        })
                                                    })
                                                    .catch((e) => {
                                                        enqueueSnackbar(`Failed to retract item from timeline: ${e}`, {
                                                            variant: 'error'
                                                        })
                                                    })
                                            }}
                                        >
                                            <PlaylistRemoveIcon color="error" />
                                        </IconButton>
                                    }
                                >
                                    <ListItemTimeline timelineID={timeline} />
                                </ListItem>
                            ))}
                        </List>

                        <Typography variant="h2" sx={{ mt: 1 }}>
                            Message:
                        </Typography>
                        <Box
                            sx={{
                                borderRadius: '10px',
                                overflow: 'hidden'
                            }}
                        >
                            <Codeblock language="json">
                                {JSON.stringify(previewMessage ?? 'null', null, 4)?.replaceAll('\\n', '\n')}
                            </Codeblock>
                        </Box>
                        {ast && (
                            <details>
                                <summary>AST</summary>
                                <Box
                                    sx={{
                                        borderRadius: '10px',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <Codeblock language="json">{JSON.stringify(ast, null, 4)}</Codeblock>
                                </Box>
                            </details>
                        )}
                        <Typography variant="h2" sx={{ mt: 1 }}>
                            Associations:
                        </Typography>
                        <Box
                            sx={{
                                borderRadius: '10px',
                                overflow: 'hidden'
                            }}
                        >
                            <Codeblock language={'json'}>{JSON.stringify(associations, null, 4)}</Codeblock>
                        </Box>
                    </Box>
                ) : (
                    <Box>nothing to inspect...</Box>
                )}
            </CCDrawer>
        </InspectorContext.Provider>
    )
}

export function useInspector(): InspectorState {
    return useContext(InspectorContext) as InspectorState
}
