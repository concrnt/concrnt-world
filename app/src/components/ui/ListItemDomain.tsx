import {
    Avatar,
    ListItemAvatar,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Tooltip,
    type SxProps
} from '@mui/material'
import { useEffect, useState } from 'react'
import { type Domain } from '@concrnt/client'
import { useClient } from '../../context/ClientContext'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

export interface ListItemDomainProps {
    domainFQDN: string
    sx?: SxProps
    onClick?: () => void
    filter?: (domain: any) => boolean
}

export const ListItemDomain = (props: ListItemDomainProps): JSX.Element | null => {
    const { client } = useClient()
    const [domain, setDomain] = useState<Domain | null>(null)

    useEffect(() => {
        client.api.getDomain(props.domainFQDN).then((e) => {
            setDomain(e ?? null)
        })
    }, [props.domainFQDN])

    if (!domain) {
        return <></>
    }

    if (props.filter && !props.filter(domain)) {
        return null
    }

    return (
        <Tooltip arrow followCursor title={domain.meta.description} placement="right">
            <ListItemButton dense sx={props.sx} onClick={props.onClick}>
                <ListItemAvatar>
                    <Avatar src={domain.meta.logo}></Avatar>
                </ListItemAvatar>
                <ListItemText
                    primary={`${domain.meta.nickname} (${domain.meta.registration})`}
                    secondary={domain.fqdn}
                />
                <ListItemIcon>
                    <OpenInNewIcon />
                </ListItemIcon>
            </ListItemButton>
        </Tooltip>
    )
}
