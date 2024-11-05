import { Box, CssBaseline, Typography } from '@mui/material'
import { ConcrntLogo } from '../theming/ConcrntLogo'

export interface FullScreenLoadingProps {
    message: string
}

export const FullScreenLoading = (props: FullScreenLoadingProps): JSX.Element => {
    const themeStr = localStorage.getItem('theme')
    let theme
    try {
        if (themeStr) {
            theme = JSON.parse(themeStr)
        }
    } catch (e) {
        console.error(e)
    }

    const backgroundColor = theme?.palette?.primary?.main || '#0476d9'
    const color = theme?.palette?.primary?.contrastText || '#ffffff'

    let themeColorMetaTag: HTMLMetaElement = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement
    if (!themeColorMetaTag) {
        themeColorMetaTag = document.createElement('meta')
        themeColorMetaTag.name = 'theme-color'
        document.head.appendChild(themeColorMetaTag)
    }
    themeColorMetaTag.content = backgroundColor

    const isMobileSize = window.matchMedia('(max-width: 600px)').matches

    return (
        <CssBaseline>
            <Box
                sx={{
                    backgroundColor,
                    color,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100dvh',
                    width: '100dvw',
                    gap: 2
                }}
            >
                <ConcrntLogo size="100px" color={color} spinning={true} />
                {!isMobileSize && <Typography variant="h5">{props.message}</Typography>}
            </Box>
        </CssBaseline>
    )
}
