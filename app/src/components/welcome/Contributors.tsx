import { Box, alpha, useTheme } from '@mui/material'

import { PassportRenderer } from '../theming/Passport'
import Tilt from 'react-parallax-tilt'

const contributers = [
    {
        ccid: 'CC707E9Aa446961E6e6C33e5d69d827e5420B69E1f',
        name: 'totegamma',
        avatar: 'https://github.com/totegamma.png',
        host: 'dev.concurrent.world'
    },
    {
        ccid: 'CC0a77dB95EA8A6150Ca7b54fcD400aB882E709737',
        name: 'kokoa',
        avatar: 'https://github.com/rassi0429.png',
        host: 'dev.concurrent.world'
    },
    {
        ccid: 'CC9e5D3D77Cc07BFf90a8c5AD96902fD7e9ce4a3DC',
        name: 'fono09',
        avatar: 'https://github.com/fono09.png',
        host: 'con.fono.jp'
    },
    {
        ccid: 'CC061509279837Ee2231c5C9079d1290A65E8e836F',
        name: 'わおん',
        avatar: 'https://github.com/waonme.png',
        host: 'dev.concurrent.world'
    },
    {
        ccid: 'CC26a9C14888b558862252E185257331D2e48b3e6b',
        name: 'Naborisk',
        avatar: 'https://github.com/naborisk.png',
        host: 'dev.concurrent.world'
    },
    {
        ccid: 'CC4Ccce3e4B200018D9a784F35ec219e24A34E73c2',
        name: 'oinarisummer',
        avatar: 'https://github.com/oinarisummer.png',
        host: 'dev.concurrent.world'
    },
    {
        ccid: 'CC0DF7bf34A68B2B77Eac609b2609e2f619B2fe12a',
        name: 'Zozokasu',
        avatar: 'https://github.com/Zozokasu.png',
        host: 'hub.concurrent.world'
    },
    {
        ccid: 'CCCb018771C38F0A06c1A5Dd8587887f0DF9a004Fa',
        name: 'ouroboros723',
        avatar: 'https://github.com/ouroboros723.png',
        host: 'cc.draboros.net'
    },
    {
        ccid: 'CC5bc66E91a30E5de7DD781a4f92FD3ed7fcF7c157',
        name: 'ryotn',
        avatar: 'https://github.com/ryotn.png',
        host: 'hub.concurrent.world'
    },
    {
        ccid: 'CC29C846bec48a549A1db2c5218C7e9294d1100773',
        name: 'Tigerwall',
        avatar: 'https://github.com/tigerwall.png',
        host: 'hub.concurrent.world'
    },
    {
        ccid: 'CC260FdC5eFAC5b1C2a5569aCA792Cbef34E784397',
        name: 'jiftechnify',
        avatar: 'https://github.com/jiftechnify.png',
        host: 'c.c-stellar.net'
    }
]

export default function Contributors(): JSX.Element {
    const theme = useTheme()

    return (
        <Box position="relative" height="300px" width="100%" overflow="hidden">
            <Box
                sx={{
                    position: 'absolute',
                    height: '100%',
                    width: '50px',
                    left: '0',
                    zIndex: 1,
                    background: `linear-gradient(to left, ${alpha(theme.palette.background.paper, 0)}, ${
                        theme.palette.background.paper
                    })`
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    height: '100%',
                    width: '50px',
                    right: '0',
                    zIndex: 1,
                    background: `linear-gradient(to right, ${alpha(useTheme().palette.background.paper, 0)}, ${
                        useTheme().palette.background.paper
                    })`
                }}
            />

            <Box
                gap="15px"
                display="flex"
                width={`${contributers.length * 415 * 2}px`}
                my={2}
                sx={{
                    '@keyframes slide': {
                        '0%': {
                            transform: 'translateX(0)'
                        },
                        '100%': {
                            transform: 'translateX(-50%)'
                        }
                    },
                    animation: 'slide 120s linear infinite'
                }}
            >
                {contributers.map((contributer, index) => {
                    return (
                        <Box key={index} minWidth="400px">
                            <Tilt glareEnable={true} glareBorderRadius="5%">
                                <PassportRenderer
                                    ccid={contributer.ccid}
                                    name={contributer.name}
                                    avatar={contributer.avatar}
                                    host={contributer.host}
                                    cdate={'2023/02/04'}
                                    trust={255}
                                />
                            </Tilt>
                        </Box>
                    )
                })}
                {contributers.map((contributer, index) => {
                    return (
                        <Box key={`second-${index}`} minWidth="400px">
                            <Tilt glareEnable={true} glareBorderRadius="5%">
                                <PassportRenderer
                                    ccid={contributer.ccid}
                                    name={contributer.name}
                                    avatar={contributer.avatar}
                                    host={contributer.host}
                                    cdate={'2023/02/04'}
                                    trust={255}
                                />
                            </Tilt>
                        </Box>
                    )
                })}
            </Box>
        </Box>
    )
}
