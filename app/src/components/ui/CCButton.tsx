import { Button, type SxProps, useTheme } from '@mui/material'
import { type ForwardRefRenderFunction, forwardRef } from 'react'

export interface CCButtonProps {
    children?: string
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
    disabled?: boolean
    sx?: SxProps
}

const _CCButton: ForwardRefRenderFunction<HTMLButtonElement, CCButtonProps> = (props, ref) => {
    const theme = useTheme()
    return (
        <Button
            {...props}
            ref={ref}
            sx={{
                ...props.sx,
                '&:disabled': {
                    color: theme.palette.text.disabled
                }
            }}
            onClick={props.onClick}
            disabled={props.disabled}
        >
            {props.children}
        </Button>
    )
}

export const CCButton = forwardRef(_CCButton)
