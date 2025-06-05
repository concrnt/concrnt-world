import { Box, Paper, Skeleton, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { type Summary, useUrlSummary } from '../../context/urlSummaryContext'
import { useGlobalState } from '../../context/GlobalState'
import { useTranslation } from 'react-i18next'

export const UrlSummaryCard = (props: { url: string }): JSX.Element | null => {
    const service = useUrlSummary()
    if (!service) return null
    const [preview, setPreview] = useState<Summary | undefined>(undefined)
    const [errored, setErrored] = useState(false)

    const { t } = useTranslation('', { keyPrefix: 'common' })
    const { getImageURL } = useGlobalState()

    useEffect(() => {
        service
            .getSummary(props.url)
            .then((summary) => {
                if (summary) setPreview(summary)
                else setErrored(true)
            })
            .catch((_) => {
                setErrored(true)
            })
    }, [props.url])

    const hostname = new URL(props.url).hostname

    if (errored) return null

    if (!preview) {
        return (
            <Paper
                variant="outlined"
                sx={{
                    display: 'flex',
                    height: '100px',
                    width: '100%',
                    overflow: 'hidden',
                    textDecoration: 'none'
                }}
            >
                <Skeleton variant="rectangular" width="100px" height={100} />
                <Box padding={1} height="100px" flex={1}>
                    <Skeleton variant="text" />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" width="40%" />
                </Box>
            </Paper>
        )
    }

    return (
        <Paper
            variant="outlined"
            sx={{
                display: 'flex',
                height: '100px',
                width: '100%',
                overflow: 'hidden',
                textDecoration: 'none',
                background: 'none'
            }}
            component={RouterLink}
            to={props.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
                e.stopPropagation()
            }}
        >
            {(preview.thumbnail || preview.icon) && (
                <Box
                    sx={{
                        width: '100px',
                        height: '100px',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundImage: `url(${getImageURL(preview.thumbnail || preview.icon)})`,
                        flexShrink: 0
                    }}
                />
            )}
            <Box padding={1} height="100px" overflow="hidden">
                <Typography
                    variant="h3"
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    width="100%"
                    lineHeight="1"
                >
                    {preview?.title || hostname}
                </Typography>

                <Typography variant="body2" width="100%" height="40px" textOverflow="ellipsis" overflow="hidden">
                    {preview?.description || t('noDescription')}
                </Typography>

                <Typography
                    variant="caption"
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    width="100%"
                >
                    {props.url}
                </Typography>
            </Box>
        </Paper>
    )
}
