import React from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { Breadcrumbs, Link } from '@mui/material'
import { useTranslation } from 'react-i18next'

export interface BreadcrumbListProps {
    // K: path, T: Translation key
    pathTitles: Record<string, string>
}
interface BreadcrumbItem {
    path: string
    title: string
}

export const BreadcrumbList = (props: BreadcrumbListProps): JSX.Element => {
    const { t } = useTranslation()
    const currentPath = useLocation()

    const breadcrumbTitles: BreadcrumbItem[] = currentPath.pathname
        .split('/')
        .reduce<BreadcrumbItem[]>((acc, path, index, paths) => {
            const currentPath = `/${paths.slice(1, index + 1).join('/')}`
            const title = props.pathTitles[currentPath]
            if (title) {
                acc.push({ path: currentPath, title: t(title) })
            }
            return acc
        }, [])

    return (
        <Breadcrumbs>
            {breadcrumbTitles.map(({ path, title }) => (
                <Link
                    key={path}
                    component={RouterLink}
                    to={path}
                    variant="h2"
                    underline="hover"
                    color="inherit"
                    sx={{
                        textTransform: 'capitalize',
                        color: 'text.primary'
                    }}
                >
                    {title}
                </Link>
            ))}
        </Breadcrumbs>
    )
}
