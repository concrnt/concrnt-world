import { IconButton, type SxProps, useTheme } from '@mui/material'
import { type ForwardRefRenderFunction, forwardRef } from 'react'

export interface CCIconButtonProps {
    children?: JSX.Element | JSX.Element[]
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
    disabled?: boolean
    sx?: SxProps
    onMouseDown?: (event: React.MouseEvent<HTMLButtonElement>) => void
    onMouseUp?: (event: React.MouseEvent<HTMLButtonElement>) => void
    onTouchStart?: (event: React.TouchEvent<HTMLButtonElement>) => void
    onTouchEnd?: (event: React.TouchEvent<HTMLButtonElement>) => void
    size?: 'small' | 'medium' | 'large'
}

const _CCIconButton: ForwardRefRenderFunction<HTMLButtonElement, CCIconButtonProps> = (props, ref) => {
    const theme = useTheme()
    return (
        <IconButton
            {...props}
            ref={ref}
            sx={{
                ...props.sx,
                color: theme.palette.text.primary,
                '&:disabled': {
                    color: theme.palette.text.disabled
                }
            }}
            onClick={props.onClick}
            onMouseDown={props.onMouseDown}
            onMouseUp={props.onMouseUp}
            onTouchStart={props.onTouchStart}
            onTouchEnd={props.onTouchEnd}
            disabled={props.disabled}
            size={props.size ?? 'medium'}
        >
            {props.children}
        </IconButton>
    )
}

export const CCIconButton = forwardRef(_CCIconButton)
