import { GenerateIdentity } from '@concrnt/client'
import { Box, Button, Typography } from '@mui/material'
import { forwardRef, useState } from 'react'

export const IdentityGenerator = forwardRef<HTMLDivElement>((props, ref): JSX.Element => {
    const [mnemonic, setMnemonic] = useState<string>('')
    const [CCID, setCCID] = useState<string>('')
    const [privateKey, setPrivateKey] = useState<string>('')
    const [publicKey, setPublicKey] = useState<string>('')

    const generate = (): void => {
        const identity = GenerateIdentity()

        setMnemonic(`${identity.mnemonic}`)
        setCCID(identity.CCID)
        setPrivateKey(identity.privateKey)
        setPublicKey(identity.publicKey)
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
                <Typography variant="h3">IdentityGenerator</Typography>
                <Button onClick={generate}>Generate</Button>
                <Typography variant="h3">mnemonic</Typography>
                <Box>
                    <Typography>{mnemonic}</Typography>
                    <Button
                        onClick={() => {
                            navigator.clipboard.writeText(mnemonic)
                        }}
                    >
                        copy
                    </Button>
                </Box>

                <Typography variant="h3">CCID</Typography>
                <Box>
                    <Typography>{CCID}</Typography>
                    <Button
                        onClick={() => {
                            navigator.clipboard.writeText(CCID)
                        }}
                    >
                        copy
                    </Button>
                </Box>

                <Typography variant="h3">publickey</Typography>
                <Box>
                    <Typography>{publicKey}</Typography>
                    <Button
                        onClick={() => {
                            navigator.clipboard.writeText(publicKey)
                        }}
                    >
                        copy
                    </Button>
                </Box>

                <Typography variant="h3">privatekey</Typography>
                <Box>
                    <Typography>{privateKey}</Typography>
                    <Button
                        onClick={() => {
                            navigator.clipboard.writeText(privateKey)
                        }}
                    >
                        copy
                    </Button>
                </Box>
            </Box>
        </div>
    )
})

IdentityGenerator.displayName = 'IdentityGenerator'
