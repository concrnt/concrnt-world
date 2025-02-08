import { memo } from 'react'
import { Box, Button, Divider, Tab, Tabs, Typography } from '@mui/material'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useClient } from '../context/ClientContext'

import { Assets } from '../components/Concord/Assets'
import { BadgeSeries } from '../components/Concord/BadgeSeries'
import { ConcordExplorer } from '../components/Concord/Explorer'
import { useConcord } from '../context/ConcordContext'

type widgets = 'assets' | 'badge' | 'explorer'

export const ConcordPage = memo((): JSX.Element => {
    const navigate = useNavigate()
    const location = useLocation()
    const tab = location.pathname.split('/').pop() as widgets

    const { client } = useClient()
    const concord = useConcord()
    const address = client?.ccid

    if (!client?.ccid) {
        return <Box>Loading...</Box>
    }

    return (
        <Box
            sx={{
                paddingX: 1,
                paddingTop: 1,
                backgroundColor: 'background.paper',
                minHeight: '100%',
                overflowY: 'scroll',
                overflowX: 'hidden'
            }}
        >
            <Typography variant="h2">Concord Network</Typography>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    my: 1
                }}
            >
                <Typography>{address ? `Connected` : 'Not connected'}</Typography>
                <Button
                    disabled={!!concord.cosmJS}
                    onClick={() => {
                        concord.connectWallet()
                    }}
                >
                    {concord.cosmJS ? 'Connected' : 'Connect Keplr'}
                </Button>
            </Box>
            <Divider />
            <Tabs
                value={tab}
                onChange={(_, v) => {
                    navigate(`/concord/${v}`)
                }}
                textColor="secondary"
                indicatorColor="secondary"
            >
                <Tab value="assets" label="Assets" />
                <Tab value="badge" label="Badge" />
                <Tab value="explorer" label="Explorer" />
            </Tabs>
            <Divider
                sx={{
                    marginBottom: 1
                }}
            />
            <Routes>
                <Route path="/assets" element={<Assets address={client.ccid} />} />
                <Route path="/badge" element={<BadgeSeries address={client.ccid} />} />
                <Route path="/explorer" element={<ConcordExplorer />} />
            </Routes>
        </Box>
    )
})

ConcordPage.displayName = 'ConcordPage'
