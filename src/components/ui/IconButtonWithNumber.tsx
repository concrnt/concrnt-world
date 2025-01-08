import { Box, IconButton, Typography, useTheme } from '@mui/material'
import { type ForwardRefRenderFunction, forwardRef } from 'react'

export interface IconButtonWithNumberProps {
    icon: JSX.Element
    onClick: (e: any) => void
    message: number
}
const _IconButtonWithNumber: ForwardRefRenderFunction<HTMLDivElement, IconButtonWithNumberProps> = (props, ref) => {
    const theme = useTheme()

    return (
        <Box
            {...props}
            sx={{
                display: 'flex',
                width: '3rem',
                alignItems: 'center'
            }}
            ref={ref}
            onClick={(e) => {
                e.stopPropagation()
            }}
        >
            <IconButton
                sx={{
                    p: 0.5,
                    color: theme.palette.text.secondary
                }}
                color="primary"
                onClick={(e) => {
                    props.onClick(e)
                    e.stopPropagation()
                }}
            >
                {props.icon}
            </IconButton>
            <Typography sx={{ fontSize: 13, lineHeight: 1 }}>{props.message > 0 ? props.message : <></>}</Typography>
        </Box>
    )
}

export const IconButtonWithNumber = forwardRef(_IconButtonWithNumber)
