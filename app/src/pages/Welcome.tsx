import Box from '@mui/material/Box'
import { Button, Divider, IconButton, Paper, Typography, alpha, useTheme } from '@mui/material'
import { Link, NavLink } from 'react-router-dom'
import GitHubIcon from '@mui/icons-material/GitHub'
import AppMock from '../components/welcome/AppMock'
import { useTranslation } from 'react-i18next'
import { GuestBase } from '../components/GuestBase'
import { TimelineCard } from '../components/TimelineCard'
import Tilt from 'react-parallax-tilt'
import { PassportRenderer } from '../components/theming/Passport'
import { DummyMessageView } from '../components/Message/DummyMessageView'

import { type Keyframes, keyframes } from '@emotion/react'
import styled from '@emotion/styled'
import { Helmet } from 'react-helmet-async'

const parallaxKeyframes = (amount: number): Keyframes => keyframes`
    from {
        transform: translateY(0%);
    }
    to {
        transform: translateY(-${amount}%);
    }
`

interface ParallaxProps {
    parallaxAmount: number
}

const Parallax = styled.div<ParallaxProps>`
    position: absolute;
    animation: ${(props) => parallaxKeyframes(props.parallaxAmount)} linear;
    animation-timeline: scroll();
`

function WelcomeBody(): JSX.Element {
    const { t } = useTranslation('', { keyPrefix: 'welcome' })
    const theme = useTheme()

    const decorations = [
        // left
        {
            username: 'SkylerJay',
            content: t('crnt1'),
            style: {
                top: '10%',
                left: '-10%'
            },
            parallax: 1000
        },
        {
            username: 'NovaPulse',
            content: t('crnt2'),
            style: {
                top: '20%',
                left: '-15%'
            },
            parallax: 100
        },
        {
            username: 'EchoBlaze',
            content: t('crnt3'),
            style: {
                top: '35%',
                left: '-8%'
            },
            parallax: 100
        },
        {
            username: 'RiverStone',
            content: t('crnt4'),
            style: {
                top: '43%',
                left: '-13%'
            },
            parallax: 500
        },
        {
            username: 'LunaDrift',
            content: t('crnt5'),
            style: {
                top: '60%',
                left: '-10%'
            },
            parallax: 1000
        },
        {
            username: 'ZephyrWind',
            content: t('crnt6'),
            style: {
                top: '50%',
                left: '0%'
            },
            parallax: 100
        },
        {
            username: 'CrystalWave',
            content: t('crnt7'),
            style: {
                top: '90%',
                left: '-10%'
            },
            parallax: 100
        },

        // right
        {
            username: 'OrionShade',
            content: t('crnt8'),
            style: {
                top: '8%',
                right: '-10%'
            },
            parallax: 100
        },
        {
            username: 'StarfallX',
            content: t('crnt9'),
            style: {
                top: '18%',
                right: '-20%'
            },
            parallax: 100
        },
        {
            username: 'EmberGlow',
            content: t('crnt10'),
            style: {
                top: '25%',
                right: '-17%'
            },
            parallax: 500
        },
        {
            username: 'SolarRay',
            content: t('crnt11'),
            style: {
                top: '50%',
                right: '-20%'
            },
            parallax: 100
        },
        {
            username: 'FrostWanderer',
            content: t('crnt12'),
            style: {
                top: '38%',
                right: '-13%'
            },
            parallax: 100
        },
        {
            username: 'MirageVibe',
            content: t('crnt13'),
            style: {
                top: '60%',
                right: '-8%'
            },
            parallax: 1000
        },

        {
            username: 'ZenithRift',
            content: t('crnt14'),
            style: {
                top: '80%',
                right: '-20%'
            },
            parallax: 100
        },

        // special
        {
            username: 'totegamma',
            icon: 'https://github.com/totegamma.png',
            content: t('crnt_totegamma'),
            style: {
                top: '120%',
                left: '-10%'
            },
            parallax: 2000
        }
    ]

    return (
        <>
            <Box
                sx={{
                    height: '100dvh',
                    width: '100%',
                    maxWidth: '1280px',
                    position: 'fixed',
                    visibility: { xs: 'hidden', sm: 'hidden', md: 'visible' }
                }}
            >
                {decorations.map((decoration, i) => (
                    <Parallax
                        key={i}
                        style={{
                            ...decoration.style,
                            backgroundColor: theme.palette.background.paper,
                            borderRadius: '4px',
                            border: '1px solid',
                            borderColor: alpha(theme.palette.text.disabled, 0.1),
                            padding: '0 4px'
                        }}
                        parallaxAmount={decoration.parallax}
                    >
                        <DummyMessageView
                            userCCID={`${decoration.content}${i}`}
                            user={{
                                username: decoration.username,
                                avatar: decoration.icon
                            }}
                            message={{
                                body: decoration.content
                            }}
                            timestamp={<></>}
                            sx={{
                                opacity: '0.8',
                                color: 'gray'
                            }}
                        />
                    </Parallax>
                ))}
            </Box>

            <Box /* top */
                mt={{ xs: '0', sm: '0', md: '100px' }}
                display="flex"
                flexDirection="column"
                alignItems="center"
            >
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    gap={2}
                    zIndex="1"
                    sx={{
                        backdropFilter: 'blur(2px)',
                        borderRadius: '10px',
                        padding: '20px'
                    }}
                >
                    <Typography
                        variant="h1"
                        fontSize="50px"
                        mb="50px"
                        zIndex="1"
                        display={{ xs: 'none', sm: 'none', md: 'block' }}
                    >
                        {t('catch')}
                    </Typography>

                    <Paper
                        variant="outlined"
                        sx={{
                            px: 1,
                            display: { xs: 'flex', sm: 'flex', md: 'none' },
                            my: '30px'
                        }}
                    >
                        <DummyMessageView
                            user={{
                                username: 'Concrnt'
                            }}
                            message={{
                                body: '## ' + t('catch')
                            }}
                        />
                    </Paper>

                    <Box maxWidth="800px" display="flex" flexDirection="column" gap={2} zIndex="1">
                        <Typography variant="body1" align="center" fontSize={{ xs: '18px', sm: '18px', md: '20px' }}>
                            {t('wish1')}
                            <br />
                            {t('wish2')}
                            <br />
                            {t('wish3')}
                            <br />
                            {t('wish4')}
                        </Typography>
                        <Typography variant="body1" align="center" fontSize={{ xs: '18px', sm: '18px', md: '20px' }}>
                            {t('wish5')}
                            <br />
                            {t('wish6')}
                        </Typography>
                    </Box>
                    <Button
                        component={NavLink}
                        to="/register"
                        sx={{
                            marginTop: '20px',
                            px: '80px',
                            py: '10px',
                            fontSize: '16px'
                        }}
                    >
                        {t('start')}
                    </Button>
                </Box>
            </Box>

            <Box
                display="flex"
                flexDirection={{ xs: 'column', sm: 'column', md: 'row' }}
                gap={2}
                alignItems="center"
                p={2}
                sx={{
                    backdropFilter: 'blur(2px)',
                    backgroundColor: alpha(theme.palette.background.paper, 0.8)
                }}
            >
                <Box flex={1} display="flex" flexDirection="column" gap={2}>
                    <Box>
                        <Typography variant="h1" fontSize="40px">
                            {t('feature1title')}
                        </Typography>
                        <Typography variant="caption" fontSize="15px">
                            {t('feature1subtitle')}
                        </Typography>
                        <Divider />
                    </Box>

                    <Box display="flex" flexDirection="column" gap={2}>
                        <Typography>{t('feature1p1')}</Typography>

                        <Typography>{t('feature1p2')}</Typography>

                        <Typography>{t('feature1p3')}</Typography>
                    </Box>
                </Box>
                <Box flex={1}>
                    <AppMock />
                </Box>
            </Box>

            <Box
                display="flex"
                flexDirection={{ xs: 'column', sm: 'column', md: 'row-reverse' }}
                alignItems="center"
                gap={2}
                p={2}
                sx={{
                    backdropFilter: 'blur(2px)',
                    backgroundColor: alpha(theme.palette.background.paper, 0.8)
                }}
            >
                <Box flex={3} display="flex" flexDirection="column" gap={2}>
                    <Box>
                        <Typography variant="h1" fontSize="40px">
                            {t('feature2title')}
                        </Typography>
                        <Typography variant="caption" fontSize="15px">
                            {t('feature2subtitle')}
                        </Typography>
                        <Divider />
                    </Box>

                    <Box display="flex" flexDirection="column" gap={2}>
                        <Typography>{t('feature2p1')}</Typography>

                        <Typography>{t('feature2p2')}</Typography>

                        <Typography>{t('feature2p3')}</Typography>
                    </Box>
                </Box>
                <Box flex={2}>
                    <Box minWidth="350px">
                        <Tilt glareEnable={true} glareBorderRadius="5%">
                            <PassportRenderer
                                ccid={''}
                                name={'<your name>'}
                                avatar={''}
                                host={'concrnt.world'}
                                cdate={'2023/02/04'}
                                trust={255}
                            />
                        </Tilt>
                    </Box>
                </Box>
            </Box>

            <Box
                display="flex"
                flexDirection={{ xs: 'column', sm: 'column', md: 'row' }}
                alignItems="center"
                gap={2}
                p={2}
                sx={{
                    backdropFilter: 'blur(2px)',
                    backgroundColor: alpha(theme.palette.background.paper, 0.8)
                }}
            >
                <Box flex={2} display="flex" flexDirection="column" gap={2} p={2}>
                    <Box>
                        <Typography variant="h1" fontSize="40px">
                            {t('feature3title')}
                        </Typography>
                        <Typography variant="caption" fontSize="15px">
                            {t('feature3subtitle')}
                        </Typography>
                        <Divider />
                    </Box>

                    <Box display="flex" flexDirection="column" gap={2}>
                        <Typography>{t('feature3p1')}</Typography>

                        <Typography>{t('feature3p2')}</Typography>
                    </Box>
                </Box>

                <Box
                    display="flex"
                    gap={1}
                    overflow="auto"
                    flexDirection={{ xs: 'row', sm: 'row', md: 'column' }}
                    flexShrink={1}
                    width={{ xs: '100%', sm: '100%', md: 'unset' }}
                >
                    <TimelineCard
                        sx={{ minWidth: '300px' }}
                        timelineFQID="tar69vv26r5s4wk0r067v20bvyw@ariake.concrnt.net"
                        name="Arrival Lounge"
                        description={t('arrivalTimelineDescription')}
                        banner="https://worldfile.cc/CC2d97694D850Df2089F48E639B4795dD95D2DCE2E/f696009d-f1f0-44f8-83fe-6387946f1b86"
                        domain="ariake.concrnt.net"
                    />
                    <TimelineCard
                        sx={{ minWidth: '300px' }}
                        timelineFQID="tdvtb8ha1d1pbckx3067v1wv8xr@denken.concrnt.net"
                        name="Dev Central"
                        description={t('devCentralDescription')}
                        banner="https://worldfile.cc/CC2d97694D850Df2089F48E639B4795dD95D2DCE2E/16e8e34f-460f-4a01-b0d1-6d0661a18ca4"
                        domain="denken.concrnt.net"
                    />
                </Box>
            </Box>

            <Box display="flex" flexDirection="column" alignItems="center">
                <Typography gutterBottom variant="h1">
                    {t('gettingStarted')}
                </Typography>
                <Button
                    component={NavLink}
                    to="/register"
                    sx={{
                        marginTop: '20px',
                        width: '100%'
                    }}
                >
                    {t('start')}
                </Button>
            </Box>

            <Box /* footer */ display="flex" justifyContent="flex-end" alignItems="center" gap="10px">
                <Typography>You can contribute ;)</Typography>
                <IconButton
                    color="primary"
                    href="https://github.com/totegamma/concurrent-web"
                    target="_blank"
                    sx={{
                        padding: '0px'
                    }}
                >
                    <GitHubIcon fontSize="large" />
                </IconButton>
            </Box>
        </>
    )
}

export default function Welcome(): JSX.Element {
    const { t } = useTranslation('', { keyPrefix: 'welcome' })

    return (
        <GuestBase
            header
            sx={{
                display: 'flex',
                gap: { xs: '50px', sm: '100px', md: '100px' },
                width: '100%',
                maxWidth: '1280px',
                margin: 'auto',
                flexDirection: 'column',
                color: 'text.primary',
                backgroundColor: 'background.paper'
            }}
            additionalButton={
                <>
                    <Button
                        variant="text"
                        component={Link}
                        to="https://square.concrnt.net/general/world/"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                            color: 'primary.contrastText'
                        }}
                    >
                        {t('guide')}
                    </Button>
                    <Button
                        variant="text"
                        component={Link}
                        to="/import"
                        sx={{
                            color: 'primary.contrastText'
                        }}
                    >
                        {t('import')}
                    </Button>
                </>
            }
        >
            <Helmet>
                <title>{t('pageTitle')}</title>
                <meta name="description" content={t('metaDescription')} />
            </Helmet>
            <WelcomeBody />
        </GuestBase>
    )
}
