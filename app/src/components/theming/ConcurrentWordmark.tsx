import { Box, Typography } from '@mui/material'
import { ConcrntLogo } from './ConcrntLogo'

export interface ConcurrentWordmarkProps {
    color: string
}

export function ConcurrentWordmark(props: ConcurrentWordmarkProps): JSX.Element {
    return (
        <Box
            sx={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'center'
            }}
        >
            <Box id="emblem">
                <ConcrntLogo size="32px" color={props.color} />
            </Box>
            <Typography
                sx={{
                    color: props.color,
                    fontWeight: 600,
                    fontSize: '22px',
                    fontFamily:
                        '"Hiragino Sans W3", "Hiragino Kaku Gothic ProN", "ヒラギノ角ゴ ProN W3", "メイリオ", Meiryo, "ＭＳ Ｐゴシック", "MS PGothic", sans-serif;'
                }}
            >
                Concrnt
            </Typography>
        </Box>
    )
}
