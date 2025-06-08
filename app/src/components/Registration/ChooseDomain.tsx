import { type Identity } from '@concrnt/client'
import { Client } from '@concrnt/worldlib'
import { Box, Button, Divider, Link, List, TextField, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { jumpToDomainRegistration } from '../../util'
import { useTranslation } from 'react-i18next'
import { ListItemDomain } from '../ui/ListItemDomain'
import { CCChip } from '../ui/CCChip'

interface ChooseDomainProps {
    next: () => void
    identity: Identity
    client: Client | undefined
    domain: string
    setDomain: (domain: string) => void
}

// Send PR your domain to add here!
const domainlist = ['ariake.concrnt.net', 'meguro.cc', 'denken.concrnt.net', 'zyouya.concrnt.net']

export function ChooseDomain(props: ChooseDomainProps): JSX.Element {
    const { t } = useTranslation('', { keyPrefix: 'registration.chooseDomain' })
    const [jumped, setJumped] = useState<boolean>(false)

    const [fqdnDraft, setFqdnDraft] = useState<string>('')
    const [serverFound, setServerFound] = useState<boolean>(false)

    useEffect(() => {
        setServerFound(false)
        let unmounted = false
        if (!props.client) return
        const fqdn = fqdnDraft.replace('https://', '').replace('/', '')
        if (fqdn === '') return
        props.client.api.getDomain(fqdn).then((e) => {
            console.log(e)
            if (unmounted) return
            if (!e?.fqdn) return
            setServerFound(true)
        })
        return () => {
            unmounted = true
        }
    }, [fqdnDraft])

    let next = window.location.href
    // strip hash
    const hashIndex = next.indexOf('#')
    if (hashIndex !== -1) {
        next = next.substring(0, hashIndex)
    }
    // add next hash
    next = `${next}#2`

    const [showOpen, setShowOpen] = useState<boolean>(true)
    const [showInvite, setShowInvite] = useState<boolean>(false)
    const [showDev, setShowDev] = useState<boolean>(false)

    const filter = useMemo(() => {
        return (domain: any) => {
            const isOpen = (domain: any) =>
                domain?.dimension === 'concrnt-mainnet' && domain?.meta?.registration === 'open'
            const isInvite = (domain: any) =>
                domain?.dimension === 'concrnt-mainnet' && domain?.meta?.registration === 'invite'
            const isDev = (domain: any) => domain?.dimension === 'concrnt-devnet'

            return (showOpen && isOpen(domain)) || (showInvite && isInvite(domain)) || (showDev && isDev(domain))
        }
    }, [showOpen, showInvite, showDev])

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px'
            }}
        >
            <Box width="100%" display="flex" flexDirection="column">
                <Typography variant="h3">{t('chooseFromList')}</Typography>

                <Box
                    sx={{
                        display: 'flex',
                        gap: '10px',
                        flexWrap: 'wrap',
                        marginBottom: '10px'
                    }}
                >
                    <CCChip
                        label={t('openedDomain')}
                        onClick={() => {
                            setShowOpen(!showOpen)
                        }}
                        variant={showOpen ? 'filled' : 'outlined'}
                        color="primary"
                    />
                    <CCChip
                        label={t('inviteDomain')}
                        onClick={() => {
                            setShowInvite(!showInvite)
                        }}
                        variant={showInvite ? 'filled' : 'outlined'}
                        color="primary"
                    />
                    <CCChip
                        label={t('devDomain')}
                        onClick={() => {
                            setShowDev(!showDev)
                        }}
                        variant={showDev ? 'filled' : 'outlined'}
                        color="primary"
                    />
                </Box>

                <List>
                    {domainlist.map((domain) => (
                        <ListItemDomain
                            key={domain}
                            domainFQDN={domain}
                            filter={filter}
                            onClick={() => {
                                setJumped(true)
                                props.setDomain(domain)
                                if (props.client && props.client.ccid)
                                    props.client.api.invalidateEntity(props.client.ccid)
                                jumpToDomainRegistration(props.identity.CCID, props.identity.privateKey, domain, next)
                            }}
                        />
                    ))}
                </List>
                <Divider>{t('or')}</Divider>
                <Typography variant="h3">{t('directInput')}</Typography>
                <Typography
                    color="text.primary"
                    component={Link}
                    variant="caption"
                    href="https://github.com/totegamma/concurrent"
                    target="_blank"
                >
                    {t('tips')}
                </Typography>
                <Box flex="1" />
                <Box sx={{ display: 'flex', gap: '10px' }}>
                    <TextField
                        placeholder="concurrent.example.tld"
                        value={fqdnDraft}
                        onChange={(e) => {
                            setFqdnDraft(e.target.value)
                        }}
                        sx={{
                            flex: 1
                        }}
                    />
                    <Button
                        disabled={!serverFound}
                        onClick={() => {
                            setJumped(true)
                            props.setDomain(fqdnDraft)
                            if (props.client && props.client.ccid) props.client.api.invalidateEntity(props.client.ccid)
                            jumpToDomainRegistration(props.identity.CCID, props.identity.privateKey, fqdnDraft, next)
                        }}
                    >
                        {t('jump')}
                    </Button>
                </Box>
            </Box>
            <Button
                disabled={!jumped}
                onClick={(): void => {
                    props.client?.api
                        .getEntity(props.identity.CCID, undefined, { cache: 'best-effort' })
                        .then((e) => {
                            if (e?.ccid != null) {
                                props.next()
                            } else {
                                alert(t('notRegistered'))
                            }
                        })
                        .catch(() => {
                            alert(t('notRegistered'))
                        })
                }}
            >
                {jumped ? t('next') : t('nextDisabled')}
            </Button>
        </Box>
    )
}
