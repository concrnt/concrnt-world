import { useEffect, useState } from 'react'
import { CCChip } from './CCChip'
import { Domain } from '@concrnt/client'
import { useClient } from '../../context/ClientContext'
import { Box, Divider, Link, Typography } from '@mui/material'
import { CCDrawer } from './CCDrawer'

export interface DomainChipProps {
    fqdn: string
    small?: boolean
}

export const DomainChip = (props: DomainChipProps): JSX.Element => {
    const { client } = useClient()
    const [domain, setDomain] = useState<Domain | undefined>(undefined)

    useEffect(() => {
        client.api.getDomain(props.fqdn).then((domain) => {
            setDomain(domain)
        })
    }, [props.fqdn])

    const [open, setOpen] = useState(false)
    const [coc, setCoc] = useState<string | undefined>(undefined)

    useEffect(() => {
        if (!open || coc) return

        fetch(`https://${props.fqdn}/code-of-conduct`)
            .then((response) => {
                if (response.ok) {
                    return response.text()
                } else {
                    return ''
                }
            })
            .then((text) => {
                setCoc(text)
            })
            .catch(() => {
                setCoc(undefined)
            })
    }, [open, coc])

    return (
        <>
            <CCChip
                size={props.small ? 'small' : 'medium'}
                label={domain?.meta?.nickname ?? props.fqdn}
                avatar={
                    <Box
                        component="img"
                        src={domain?.meta?.logo ?? ''}
                        alt={domain?.meta?.nickname ?? props.fqdn}
                        sx={{
                            width: props.small ? 24 : 32,
                            height: props.small ? 24 : 32,
                            borderRadius: '50%',
                            objectFit: 'cover'
                        }}
                    />
                }
                onClick={() => {
                    setOpen(true)
                }}
            />
            <CCDrawer open={open} onClose={() => setOpen(false)}>
                <Box sx={{ padding: 2 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 1
                        }}
                    >
                        <Box
                            component="img"
                            src={domain?.meta?.logo ?? ''}
                            alt={domain?.meta?.nickname ?? props.fqdn}
                            sx={{
                                width: '3rem',
                                height: 'auto'
                            }}
                        />
                        <Typography variant="h1">{domain?.meta?.nickname ?? props.fqdn}</Typography>
                    </Box>
                    <Typography variant="caption">{props.fqdn}</Typography>
                    <Divider sx={{ marginY: 2 }} />
                    <Typography>{domain?.meta?.description}</Typography>
                    <Box sx={{ marginTop: 2 }}>
                        <Typography variant="h2">Code of Conduct</Typography>
                        <Divider sx={{ marginY: 1 }} />
                        {coc ? (
                            <Box
                                sx={{
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word'
                                }}
                            >
                                {coc}
                            </Box>
                        ) : (
                            <Typography>Code of Conduct is not available.</Typography>
                        )}
                    </Box>

                    <Divider sx={{ marginY: 2 }} />

                    <Link href={`https://${props.fqdn}/tos`} target="_blank" rel="noopener noreferrer">
                        Terms of Service
                    </Link>
                </Box>
            </CCDrawer>
        </>
    )
}
