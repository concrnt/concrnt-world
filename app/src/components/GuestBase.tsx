import { useState } from 'react'
import { Themes, loadConcurrentTheme } from '../themes'
import { type ConcurrentTheme } from '../model'
import { ThemeProvider } from '@mui/material'
import { Box, Button, CssBaseline, type SxProps } from '@mui/material'
import { ConcurrentWordmark } from './theming/ConcurrentWordmark'
import { Link } from 'react-router-dom'

export interface GuestBaseProps {
    nologo?: boolean
    children: JSX.Element | JSX.Element[]
    sx?: SxProps
    additionalButton?: JSX.Element
    header?: boolean
}

export const GuestBase = (props: GuestBaseProps): JSX.Element => {
    const [themeName, setThemeName] = useState<string>('blue')
    const [theme, setTheme] = useState<ConcurrentTheme>(loadConcurrentTheme(themeName))

    const themes: string[] = Object.keys(Themes)
    const randomTheme = (): void => {
        const box = themes.filter((e) => e !== themeName)
        const newThemeName = box[Math.floor(Math.random() * box.length)]
        setThemeName(newThemeName)
        setTheme(loadConcurrentTheme(newThemeName))
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box
                sx={{
                    display: 'flex',
                    flexFlow: 'column',
                    alignItems: 'center',
                    backgroundColor: (props.sx as any)?.backgroundColor ?? theme.palette.background.default,
                    width: '100%',
                    minHeight: '100vh',
                    overflowY: 'auto',
                    overflowX: 'hidden'
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexFlow: 'column',
                        backgroundColor: props.header ? theme.palette.primary.main : undefined,
                        color: props.header ? theme.palette.primary.contrastText : undefined,
                        width: '100%',
                        alignItems: 'center'
                    }}
                >
                    <Box
                        display="flex"
                        justifyContent="space-between"
                        p={1}
                        alignItems="center"
                        sx={{
                            width: '100%',
                            maxWidth: '1280px'
                        }}
                    >
                        {props.nologo ? (
                            <Box />
                        ) : (
                            <Button
                                disableRipple
                                variant="text"
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    flexDirection: 'row',
                                    textTransform: 'none',
                                    '&:hover': {
                                        background: 'none'
                                    }
                                }}
                                component={Link}
                                to="/welcome"
                            >
                                <ConcurrentWordmark
                                    color={
                                        props.header
                                            ? theme.palette.primary.contrastText
                                            : theme.palette.background.contrastText
                                    }
                                />
                            </Button>
                        )}
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 1
                            }}
                        >
                            <Button variant="text" onClick={randomTheme}>
                                ✨
                            </Button>
                            {props.additionalButton}
                        </Box>
                    </Box>
                </Box>
                <Box
                    sx={{
                        display: 'flex',
                        flex: 1,
                        maxWidth: '1280px',
                        width: '100%',
                        flexDirection: 'column'
                    }}
                >
                    <Box sx={props.sx}>{props.children}</Box>
                </Box>
            </Box>
        </ThemeProvider>
    )
}
