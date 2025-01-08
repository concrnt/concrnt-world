import { type SxProps, Link, type TypographyOwnProps } from '@mui/material'
import { type HTMLAttributeAnchorTarget } from 'react'
import { Link as RouterLink } from 'react-router-dom'

export interface CCLinkProps {
    underline?: 'none' | 'hover' | 'always'
    sx?: SxProps
    to: string
    children?: JSX.Element | Array<JSX.Element | undefined> | React.ReactNode | string
    color?: TypographyOwnProps['color']
    fontSize?: string
    target?: HTMLAttributeAnchorTarget
}

export const CCLink = (props: CCLinkProps): JSX.Element => {
    const isInternal = props.to.startsWith('/') || props.to.startsWith('https://concrnt.world')

    if (isInternal) {
        return (
            <Link
                component={RouterLink}
                underline={props.underline ?? 'hover'}
                sx={props.sx}
                color={props.color ?? 'inherit'}
                fontSize={props.fontSize}
                to={props.to}
                target={props.target ?? '_self'}
                onClick={(e) => {
                    e.stopPropagation()
                }}
            >
                {props.children}
            </Link>
        )
    } else {
        return (
            <Link
                underline={props.underline ?? 'hover'}
                sx={props.sx}
                color={props.color ?? 'inherit'}
                fontSize={props.fontSize}
                href={props.to}
                target={props.target ?? '_blank'}
                onClick={(e) => {
                    e.stopPropagation()
                }}
            >
                {props.children}
            </Link>
        )
    }
}
