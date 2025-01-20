import { Chip, type SxProps, alpha, useTheme } from '@mui/material'
import { type ForwardRefRenderFunction, type Ref, forwardRef } from 'react'
import { Link as NavLink } from 'react-router-dom'

export interface CCChipProps {
    clickable?: boolean
    label: string
    onDelete?: (event: React.MouseEvent<HTMLButtonElement>) => void
    sx?: SxProps
    to?: string
    size?: 'small' | 'medium'
    icon?: JSX.Element
    avatar?: React.ReactElement
    target?: string
    rel?: string
    onClick?: (event: React.MouseEvent<HTMLDivElement | HTMLAnchorElement>) => void
    variant?: 'filled' | 'outlined'
}

const _CCChip: ForwardRefRenderFunction<HTMLDivElement | HTMLAnchorElement, CCChipProps> = (props, ref) => {
    const theme = useTheme()

    if (props.to) {
        return (
            <Chip
                {...props}
                ref={ref as Ref<HTMLAnchorElement>}
                size={props.size}
                component={NavLink}
                to={props.to}
                sx={{
                    ...props.sx,
                    cursor: 'pointer',
                    backgroundColor: alpha(theme.palette.text.primary, 0.1)
                }}
                label={props.label}
                onClick={(e) => {
                    e.stopPropagation()
                }}
                onDelete={props.onDelete}
                icon={props.icon}
            />
        )
    }

    return (
        <Chip
            {...props}
            ref={ref as Ref<HTMLDivElement>}
            size={props.size}
            sx={{
                ...props.sx
            }}
            label={props.label}
            onClick={(e) => {
                e.stopPropagation()
                props.onClick?.(e)
            }}
            onDelete={props.onDelete}
            variant={props.variant}
            icon={props.icon}
        />
    )
}

export const CCChip = forwardRef(_CCChip)
