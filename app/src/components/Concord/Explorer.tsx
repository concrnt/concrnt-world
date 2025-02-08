import { Box, Typography, Button, TextField, Divider, List, ListItemButton, ListItemText } from '@mui/material'
import { useEffect, useState } from 'react'
import { useConcord } from '../../context/ConcordContext'

export const ConcordExplorer = (): JSX.Element => {
    const [inspectTxDraft, setInspectTxDraft] = useState<string>('')
    const [recentTxs, setRecentTxs] = useState<any>(null)

    const concord = useConcord()

    useEffect(() => {
        concord.getRecentTxs().then((txs) => {
            setRecentTxs(txs)
        })
    }, [])

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    width: '100%'
                }}
            >
                <TextField
                    fullWidth
                    label="Inspect Tx"
                    placeholder="0xE4F706D0B3D255954D344CCE4BBDFF51F3B3A2B76B4AB63867F421639670343A"
                    value={inspectTxDraft}
                    onChange={(e) => {
                        setInspectTxDraft(e.target.value)
                    }}
                />
                <Button
                    sx={{
                        height: '100%'
                    }}
                    disabled={!inspectTxDraft}
                    onClick={() => {
                        concord.inspectTx(inspectTxDraft)
                    }}
                >
                    Inspect
                </Button>
            </Box>
            <Divider />
            <Typography variant="h3">Recent Transactions</Typography>
            <List disablePadding>
                {recentTxs?.result?.txs?.map((tx: any, i: number) => (
                    <ListItemButton
                        key={i}
                        onClick={() => {
                            concord.inspectTx(tx.hash)
                        }}
                    >
                        <ListItemText
                            primary={`${tx.hash.slice(0, 10)}...${tx.hash.slice(-10)}@${tx.height}`}
                            secondary={tx.tx_result.code ? 'Error' : 'Success'}
                        />
                    </ListItemButton>
                ))}
            </List>
        </Box>
    )
}
