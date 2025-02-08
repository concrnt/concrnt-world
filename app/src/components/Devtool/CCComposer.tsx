import { Box, Button, Divider, MenuItem, Select, TextField, Typography } from '@mui/material'
import { forwardRef, useState } from 'react'
import { useClient } from '../../context/ClientContext'
import { type Schema } from '@concrnt/worldlib'
import { CCEditor } from '../ui/cceditor'

export const CCComposer = forwardRef<HTMLDivElement>((props, ref): JSX.Element => {
    const { client } = useClient()

    const [cctype, setcctype] = useState<'message' | 'association' | 'profile'>('message')
    const [schemaURL, setSchemaURL] = useState<string>('')
    const [schemaURLDraft, setSchemaURLDraft] = useState<string>('')

    const [streams, setStreams] = useState<string>('')

    const [associationTarget, setAssociationTarget] = useState<string>('')
    const [associationTargetAuthor, setAssociationTargetAuthor] = useState<string>('')

    const [data, setData] = useState<any>({})

    const createMessage = async (): Promise<void> => {
        client.api.createMessage(schemaURL as Schema, data, streams.split(','))
    }

    const createAssociation = async (): Promise<void> => {
        client.api.createAssociation(
            schemaURL as Schema,
            data,
            associationTarget,
            associationTargetAuthor,
            streams.split(',')
        )
    }

    const createProfile = async (): Promise<void> => {
        client.api.upsertProfile(schemaURL as Schema, data, {})
    }

    return (
        <div ref={ref} {...props}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    height: '100%'
                }}
            >
                <Typography variant="h3">Concurrent Composer</Typography>
                <Select
                    value={cctype}
                    label="Object Type"
                    onChange={(e) => {
                        setcctype(e.target.value as any)
                    }}
                >
                    <MenuItem value={'message'}>Message</MenuItem>
                    <MenuItem value={'association'}>Association</MenuItem>
                    <MenuItem value={'profile'}>Profile</MenuItem>
                </Select>
                {cctype === 'message' && (
                    <>
                        <TextField
                            label="Streams"
                            value={streams}
                            onChange={(e) => {
                                setStreams(e.target.value)
                            }}
                        />
                    </>
                )}
                {cctype === 'association' && (
                    <>
                        <TextField
                            label="Target"
                            value={associationTarget}
                            onChange={(e) => {
                                setAssociationTarget(e.target.value)
                            }}
                        />
                        <TextField
                            label="Target Author"
                            value={associationTargetAuthor}
                            onChange={(e) => {
                                setAssociationTargetAuthor(e.target.value)
                            }}
                        />
                        <TextField
                            label="Streams"
                            value={streams}
                            onChange={(e) => {
                                setStreams(e.target.value)
                            }}
                        />
                    </>
                )}

                <Divider />

                <TextField
                    label="Schema URL"
                    value={schemaURLDraft}
                    onChange={(e) => {
                        setSchemaURLDraft(e.target.value)
                    }}
                />
                <Button
                    onClick={() => {
                        setSchemaURL(schemaURLDraft)
                    }}
                >
                    Load
                </Button>

                <CCEditor schemaURL={schemaURL} value={data} setValue={setData} />
                <Button
                    onClick={() => {
                        switch (cctype) {
                            case 'message':
                                createMessage()
                                break
                            case 'association':
                                createAssociation()
                                break
                            case 'profile':
                                createProfile()
                                break
                        }
                    }}
                >
                    Create
                </Button>
            </Box>
        </div>
    )
})

CCComposer.displayName = 'CCComposer'
