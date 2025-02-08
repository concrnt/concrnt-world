import { forwardRef, useState } from 'react'
import { useClient } from '../../context/ClientContext'
import { Box, Button, TextField, Typography } from '@mui/material'
import { IssueJWT } from '@concrnt/client'

export const UserJWT = forwardRef<HTMLDivElement>((props, ref): JSX.Element => {
    const { client } = useClient()

    const [issuedJwt, setIssuedJwt] = useState<string>('')
    const [audience, setAudience] = useState<string>(client.host)
    const [subject, setSubject] = useState<string>('')

    const issueJwt = (): void => {
        if (!client?.keyPair?.privatekey) return
        setIssuedJwt(IssueJWT(client.keyPair.privatekey, { iss: client?.ccid, aud: audience, sub: subject }))
    }

    return (
        <div ref={ref} {...props}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                }}
            >
                <Typography variant="h3">User signed JWT</Typography>
                <Typography variant="h4">audience</Typography>
                <TextField
                    label="audience"
                    multiline
                    value={audience}
                    onChange={(e: any) => {
                        setAudience(e.target.value)
                    }}
                />
                <Typography variant="h4">subject</Typography>
                <TextField
                    label="subject"
                    multiline
                    value={subject}
                    onChange={(e: any) => {
                        setSubject(e.target.value)
                    }}
                />
                <Button onClick={issueJwt}>issue</Button>
                <Typography>result:</Typography>
                <Typography sx={{ wordBreak: 'break-all' }}>{issuedJwt}</Typography>
                <Button
                    onClick={() => {
                        navigator.clipboard.writeText(issuedJwt)
                    }}
                >
                    copy
                </Button>
            </Box>
        </div>
    )
})

UserJWT.displayName = 'UserJWT'
