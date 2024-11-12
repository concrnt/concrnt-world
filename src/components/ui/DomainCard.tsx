import { Avatar, Paper, useTheme, Checkbox, type SxProps, Typography, Box } from '@mui/material'
import { useEffect, useState } from 'react'
import { type CoreDomain } from '@concurrent-world/client'
import { useClient } from '../../context/ClientContext'

export interface DomainCardProps {
    domainFQDN: string
    selected: boolean
    sx?: SxProps
    onClick?: (_: string) => void
    onCheck?: (_: boolean) => void
}

export const DomainCard = (props: DomainCardProps): JSX.Element | null => {
    const { client } = useClient()
    const theme = useTheme()
    const [domain, setDomain] = useState<CoreDomain | null>(null)

    useEffect(() => {
        client.api.getDomain(props.domainFQDN).then((e) => {
            setDomain(e ?? null)
        })
    }, [props.domainFQDN])

    if (!domain) {
        return <></>
    }

    return (
        <Paper
            variant="outlined"
            sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px',
                gap: 1,
                outline: props.selected ? '2px solid ' + theme.palette.primary.main : 'none'
            }}
            onClick={() => {
                props.onClick?.(props.domainFQDN)
            }}
        >
            <Box display="flex" flexDirection="row" alignItems="center" gap={1}>
                <Avatar src={domain.meta.logo} />
                <Box display="flex" flexDirection="column" alignItems="flex-start" justifyContent="center" gap={0.5}>
                    <Typography variant="h3" lineHeight="1">
                        {domain.meta.nickname}
                    </Typography>
                    <Typography variant="subtitle1" lineHeight="1">
                        {domain.fqdn}
                    </Typography>
                </Box>
            </Box>
            <Checkbox
                checked={props.selected}
                onChange={(e) => {
                    props.onCheck?.(e.target.checked)
                }}
            />
        </Paper>
    )
}
