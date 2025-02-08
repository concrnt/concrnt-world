import React from 'react'
import { Preview } from '@storybook/react'
import { Themes, loadConcurrentTheme } from '../src/themes'
import { Box, CssBaseline, Paper, ThemeProvider, Typography } from '@mui/material'

const themeNames = Object.keys(Themes)

const preview: Preview = {
    parameters: {
        layout: 'fullscreen'
    },
    globalTypes: {
        theme: {
            description: 'Global theme for components',
            defaultValue: 'All',
            toolbar: {
                title: 'Theme',
                icon: 'circlehollow',
                dynamicTitle: true,
                items: ['All', ...themeNames]
            }
        }
    },
    decorators: [
        (StoryFn, context) => {
            const themeName = context.globals.theme
            const previewTarget = Array()
            if (themeName === 'All') {
                themeNames.forEach((themeName) => {
                    previewTarget.push(loadConcurrentTheme(themeName, {}))
                })
            } else {
                previewTarget.push(loadConcurrentTheme(themeName, {}))
            }
            return (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100vh'
                    }}
                >
                    {previewTarget.map((theme) => (
                        <ThemeProvider theme={theme}>
                            <CssBaseline />
                            <Box
                                sx={{
                                    backgroundColor: 'background.default',
                                    p: 2,
                                    flex: 1
                                }}
                            >
                                <Paper
                                    sx={{
                                        p: 2
                                    }}
                                >
                                    <Typography>{theme.meta.name}</Typography>
                                    <StoryFn />
                                </Paper>
                            </Box>
                        </ThemeProvider>
                    ))}
                </Box>
            )
        }
    ]
}

export default preview
