import { Box, Typography } from '@mui/material'
import { ConcrntLogo } from '../theming/ConcrntLogo'

export interface LoadingProps {
    message: string
    color: string
}

export const Loading = (props: LoadingProps): JSX.Element => {
    return (
        <Box
            sx={{
                color: props.color,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
            }}
        >
            <ConcrntLogo size="30px" color={props.color} spinning={true} />
            <Typography variant="body1">{props.message}</Typography>
        </Box>
    )
}
