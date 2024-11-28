import { memo } from 'react'
import { Box, Divider, Fade, Tab, Tabs, Typography } from '@mui/material'
import { UserJWT } from '../components/Devtool/UserJWT'
import { CCComposer } from '../components/Devtool/CCComposer'
import { IdentityGenerator } from '../components/Devtool/IdentityGenerator'
import { useLocation } from 'react-router-dom'
import { Debugger } from '../components/Devtool/Debugger'
import { Helmet } from 'react-helmet-async'

type widgets = 'debug' | 'composer' | 'userJWT' | 'idgen'

export const Devtool = memo((): JSX.Element => {
    const path = useLocation()
    const tab: widgets = (path.hash.replace('#', '') as widgets) || 'debug'

    return (
        <>
            <Helmet>
                <title>Devtool - Concrnt</title>
                <meta name="description" content="Concrnt Devtool" />
            </Helmet>
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
                <Typography variant="h2">Devtool</Typography>
                <Divider />
                <Tabs
                    value={tab}
                    onChange={(_, next) => {
                        window.location.hash = next
                    }}
                    textColor="secondary"
                    indicatorColor="secondary"
                >
                    <Tab value="debug" label="Debugger" />
                    <Tab value="composer" label="Composer" />
                    <Tab value="userJWT" label="UserJWT" />
                    <Tab value="idgen" label="IdentityGenerator" />
                </Tabs>
                <Divider />
                <Box sx={{ position: 'relative', mt: '20px' }}>
                    <Fade in={tab === 'debug'} unmountOnExit>
                        <Box sx={{ position: 'absolute', width: '100%' }}>
                            <Debugger />
                        </Box>
                    </Fade>
                    <Fade in={tab === 'composer'} unmountOnExit>
                        <Box sx={{ position: 'absolute', width: '100%' }}>
                            <CCComposer />
                        </Box>
                    </Fade>
                    <Fade in={tab === 'userJWT'} unmountOnExit>
                        <Box sx={{ position: 'absolute', width: '100%' }}>
                            <UserJWT />
                        </Box>
                    </Fade>
                    <Fade in={tab === 'idgen'} unmountOnExit>
                        <Box sx={{ position: 'absolute', width: '100%' }}>
                            <IdentityGenerator />
                        </Box>
                    </Fade>
                </Box>
            </Box>
        </>
    )
})

Devtool.displayName = 'Devtool'
