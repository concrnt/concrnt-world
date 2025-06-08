import { Box, Divider, List, Paper, Tab, Tabs } from '@mui/material'
import { TimelineHeader } from '../TimelineHeader'

import ListIcon from '@mui/icons-material/List'
import { DummyMessageView } from '../Message/DummyMessageView'
import { Fragment, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function AppMock(): JSX.Element {
    const [tab, setTab] = useState(0)

    const { t } = useTranslation('', { keyPrefix: 'mock' })

    const mockData = [
        {
            listTitle: t('home.title'),
            timeline: [
                {
                    ccid: 'solitudeSam',
                    user: {
                        username: 'solitudeSam'
                    },
                    message: {
                        body: t('home.crnt1')
                    }
                },
                {
                    ccid: 'geekyTom',
                    user: {
                        username: 'geekyTom'
                    },
                    message: {
                        body: t('home.crnt2')
                    }
                },
                {
                    ccid: 'cozyCara',
                    user: {
                        username: 'cozyCara'
                    },
                    message: {
                        body: t('home.crnt3')
                    }
                },
                {
                    ccid: 'bookwormLiz',
                    user: {
                        username: 'bookwormLiz'
                    },
                    message: {
                        body: t('home.crnt4')
                    }
                },
                {
                    ccid: 'geekyTom',
                    user: {
                        username: 'geekyTom'
                    },
                    message: {
                        body: t('home.crnt5')
                    }
                }
            ]
        },
        {
            listTitle: t('game.title'),
            timeline: [
                {
                    ccid: 'MechaMaster88',
                    user: {
                        username: 'MechaMaster88'
                    },
                    message: {
                        body: t('game.crnt1')
                    }
                },
                {
                    ccid: 'CtrlAltDefeat_',
                    user: {
                        username: 'CtrlAltDefeat_'
                    },
                    message: {
                        body: t('game.crnt2')
                    }
                },
                {
                    ccid: 'GamerGalaxy_',
                    user: {
                        username: 'GamerGalaxy_'
                    },
                    message: {
                        body: t('game.crnt3')
                    }
                },
                {
                    ccid: 'retroReveler',
                    user: {
                        username: 'retroReveler'
                    },
                    message: {
                        body: t('game.crnt4')
                    }
                },
                {
                    ccid: 'bitBard',
                    user: {
                        username: 'bitBard'
                    },
                    message: {
                        body: t('game.crnt5')
                    }
                }
            ]
        },
        {
            listTitle: t('food.title'),
            timeline: [
                {
                    ccid: 'TofuTribe',
                    user: {
                        username: 'TofuTribe'
                    },
                    message: {
                        body: t('food.crnt1')
                    }
                },
                {
                    ccid: 'SpiceSeeker_',
                    user: {
                        username: 'SpiceSeeker_'
                    },
                    message: {
                        body: t('food.crnt2')
                    }
                },
                {
                    ccid: 'NoodleNomad',
                    user: {
                        username: 'NoodleNomad'
                    },
                    message: {
                        body: t('food.crnt3')
                    }
                },
                {
                    ccid: 'BrewedLife',
                    user: {
                        username: 'BrewedLife'
                    },
                    message: {
                        body: t('food.crnt4')
                    }
                },
                {
                    ccid: 'CrispyCritic_',
                    user: {
                        username: 'CrispyCritic_'
                    },
                    message: {
                        body: t('food.crnt5')
                    }
                }
            ]
        }
    ]

    const data = mockData[tab]

    useEffect(() => {
        const interval = setInterval(() => {
            setTab((tab) => (tab + 1) % mockData.length)
        }, 5000)
        return () => {
            clearInterval(interval)
        }
    }, [])

    return (
        <Paper
            sx={{
                flexGrow: '1',
                margin: { xs: 0.5, sm: 1 },
                mb: { xs: 0, sm: '10px' },
                display: 'flex',
                flexFlow: 'column',
                borderRadius: 2,
                overflow: 'hidden',
                background: 'none',
                backgroundColor: 'background.paper'
            }}
        >
            <TimelineHeader title={data.listTitle} titleIcon={<ListIcon />} />

            <Tabs value={tab} textColor="secondary" indicatorColor="secondary">
                {mockData.map((e) => (
                    <Tab key={e.listTitle} label={e.listTitle} />
                ))}
            </Tabs>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    py: { xs: 1, sm: 1 },
                    px: { xs: 1, sm: 2 },
                    height: '400px',
                    overflowY: 'auto'
                }}
            >
                <List sx={{ flex: 1, width: '100%' }}>
                    {data.timeline.map((message, i) => (
                        <Fragment key={i}>
                            <DummyMessageView message={message.message} user={message.user} userCCID={message.ccid} />
                            <Divider />
                        </Fragment>
                    ))}
                </List>
            </Box>
        </Paper>
    )
}
