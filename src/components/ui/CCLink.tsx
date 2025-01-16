import { type SxProps, Link, type TypographyOwnProps } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export interface CCLinkProps {
    underline?: 'none' | 'hover' | 'always'
    sx?: SxProps
    to: string
    children?: JSX.Element | Array<JSX.Element | undefined> | React.ReactNode | string
    color?: TypographyOwnProps['color']
    fontSize?: string
}

export const CCLink = (props: CCLinkProps): JSX.Element => {
    const isInternal = props.to.startsWith('/') || props.to.startsWith('https://concrnt.world')

    if (isInternal) {
        let link = props.to
        if (link.startsWith('https://concrnt.world')) {
            link = link.replace('https://concrnt.world', '')
        }

        return (
            <Link
                component={RouterLink}
                underline={props.underline ?? 'hover'}
                sx={props.sx}
                color={props.color ?? 'inherit'}
                fontSize={props.fontSize}
                to={link}
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
                target={'_blank'}
                rel={'noreferrer noopener'}
                onClick={(e) => {
                    e.stopPropagation()
                }}
            >
                {props.children}
            </Link>
        )
    }
}
