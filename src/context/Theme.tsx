import { CssBaseline, ThemeProvider } from '@mui/material'
import { usePreference } from './PreferenceContext'
import { useEffect, useState } from 'react'
import { type ConcurrentTheme } from '../model'
import { loadConcurrentTheme } from '../themes'

interface ConcrntThemeProps {
    children: React.ReactNode
}

export const ConcrntThemeProvider = (props: ConcrntThemeProps): JSX.Element => {
    const [themeName] = usePreference('themeName')
    const [customThemes] = usePreference('customThemes')
    const [theme, setTheme] = useState<ConcurrentTheme>(loadConcurrentTheme(themeName, customThemes))

    useEffect(() => {
        const newtheme = loadConcurrentTheme(themeName, customThemes)
        localStorage.setItem('theme', JSON.stringify(newtheme))
        setTheme(newtheme)
        let themeColorMetaTag: HTMLMetaElement = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement
        if (!themeColorMetaTag) {
            themeColorMetaTag = document.createElement('meta')
            themeColorMetaTag.name = 'theme-color'
            document.head.appendChild(themeColorMetaTag)
        }
        themeColorMetaTag.content = newtheme.palette.background.default
    }, [themeName, customThemes])

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {props.children}
        </ThemeProvider>
    )
}
