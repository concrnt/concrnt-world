import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
    Button,
    TextField,
    InputAdornment
} from '@mui/material'
import { useEffect, useState } from 'react'
import { CCUserChip } from '../ui/CCUserChip'
import { CCDrawer } from '../ui/CCDrawer'

import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward'
import { type Badge } from '../../model'
import { useConcord } from '../../context/ConcordContext'
import { CurrencyText } from '../ui/CurrencyText'
import { useTranslation } from 'react-i18next'

export interface AssetsProps {
    address: string
}

export const Assets = (props: AssetsProps): JSX.Element => {
    const concord = useConcord()
    const { t } = useTranslation('', { keyPrefix: 'pages.concord.assets' })

    const [balance, setBalance] = useState<any>(null)
    const [badges, setBadges] = useState<Badge[]>([])

    const [openSend, setOpenSend] = useState<boolean>(false)

    const [sendAmount, setSendAmount] = useState<string>('')
    const [sendRecipient, setSendRecipient] = useState<string>('')

    useEffect(() => {
        if (!props.address) return
        ;(async () => {
            setBalance(await concord.getBalance(props.address))
            setBadges(await concord.getBadges(props.address))
        })()
    }, [props.address])

    const uAmpere = balance?.balances?.find((b: any) => b.denom === 'uAmpere')?.amount ?? 0
    const mAmpere = uAmpere / 1000

    return (
        <Box>
            <Box display="flex" flexDirection="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h2">Points</Typography>
                <Button
                    disabled={!concord.cosmJS}
                    size="small"
                    onClick={() => {
                        setOpenSend(true)
                    }}
                    startIcon={<ArrowOutwardIcon />}
                >
                    {t('send')}
                </Button>
            </Box>
            <Box display="flex" flexDirection="row" alignItems="center" justifyContent="center">
                <Tooltip
                    title={
                        <>
                            <Typography>={mAmpere}mA</Typography>
                            <Typography>={uAmpere}uA</Typography>
                        </>
                    }
                    placement="top"
                    arrow
                >
                    <Box display="flex" flexDirection="row" alignItems="baseline" gap={1}>
                        <Typography variant="h3" fontSize="2.5rem">
                            <CurrencyText value={uAmpere} />
                        </Typography>
                    </Box>
                </Tooltip>
            </Box>
            <Typography variant="h2">Badges</Typography>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Visual</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>CreatedBy</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {badges.map((b: Badge) => (
                        <TableRow key={b.badgeId}>
                            <TableCell>
                                <img
                                    src={b.uri}
                                    width="50px"
                                    alt={b.name}
                                    onClick={() => {
                                        concord.inspectBadge({
                                            seriesId: b.classId,
                                            badgeId: b.badgeId
                                        })
                                    }}
                                />
                            </TableCell>
                            <TableCell>{b.name}</TableCell>
                            <TableCell>{b.description}</TableCell>
                            <TableCell>
                                <CCUserChip avatar ccid={b.creator} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <CCDrawer
                open={openSend}
                onClose={() => {
                    setOpenSend(false)
                }}
            >
                <Box display="flex" flexDirection="column" gap={1} padding={2}>
                    <Typography variant="h2">{t('send')}</Typography>

                    <TextField
                        label="Amount"
                        value={sendAmount}
                        onChange={(e) => {
                            setSendAmount(e.target.value)
                        }}
                        InputProps={{
                            endAdornment: <InputAdornment position="end">uAmpere</InputAdornment>
                        }}
                    />

                    <TextField
                        label="Recipient"
                        value={sendRecipient}
                        onChange={(e) => {
                            setSendRecipient(e.target.value)
                        }}
                    />

                    <Button
                        onClick={() => {
                            if (!concord.cosmJS) return
                            concord.sendTokens(sendRecipient, sendAmount).then(() => {
                                setOpenSend(false)
                            })
                        }}
                    >
                        {t('send')}
                    </Button>
                </Box>
            </CCDrawer>
        </Box>
    )
}
