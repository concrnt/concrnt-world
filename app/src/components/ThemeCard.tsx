import { Box, Button, Paper, Typography } from '@mui/material'
import { type ConcurrentTheme } from '../model'
import { createConcurrentThemeFromObject } from '../themes'
import { ConcrntLogoSplitted } from './theming/ConcrntLogo_Splitted'

export interface ThemeCardProps {
    theme: ConcurrentTheme
    onClick?: () => void
    additionalButton?: JSX.Element
}

export const ThemeCard = (props: ThemeCardProps): JSX.Element => {
    const theme = createConcurrentThemeFromObject(props.theme)

    const bgColor =
        theme.palette.background.default === theme.palette.primary.contrastText
            ? theme.palette.primary.main
            : theme.palette.background.default

    return (
        <Paper variant="outlined">
            <Button
                style={{
                    border: 'none',
                    background: theme.palette.background.paper,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    justifyContent: 'flex-start'
                }}
                color="info"
                onClick={(e) => {
                    props.onClick?.()
                    e.stopPropagation()
                }}
                variant="outlined"
            >
                <Box
                    sx={{
                        display: 'flex',
                        borderRadius: '100px',
                        background: theme.palette.primary.contrastText
                    }}
                >
                    <ConcrntLogoSplitted
                        size="40px"
                        upperColor={theme.palette.primary.main}
                        lowerColor={bgColor}
                        frameColor={bgColor}
                    />
                </Box>
                <Typography
                    sx={{
                        color: theme.palette.text.primary,
                        flexGrow: 1,
                        textTransform: 'none',
                        textOverflow: 'ellipsis',
                        display: 'block',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                    }}
                    variant="button"
                >
                    {theme.meta?.name}
                </Typography>
                {props.additionalButton}
            </Button>
        </Paper>
    )
}
