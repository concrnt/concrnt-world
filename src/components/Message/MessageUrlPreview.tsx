import { Box, Paper, Skeleton, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { type Summary, useUrlSummary } from '../../context/urlSummaryContext'
import { useGlobalState } from '../../context/GlobalState'

export interface MessageUrlPreviewProps {
    messageBody: string
    limit?: number
}

export const MessageUrlPreview = (props: MessageUrlPreviewProps): JSX.Element | null => {
    // strip markdown image syntax
    let replaced = props.messageBody.replace(/!\[.*\]\(.*\)/g, '')

    // strip codeblock
    replaced = replaced.replace(/```[\s\S]*?```/g, '')

    // strip inline code
    replaced = replaced.replace(/`[\s\S]*?`/g, '')

    // strip img tag
    replaced = replaced.replace(/<img.*?>/g, '')

    // strip social tag
    replaced = replaced.replace(/<social.*?>.*?<\/social>/g, '')

    // strip emojipack tag
    replaced = replaced.replace(/<emojipack.*?\/>/g, '')

    // replace markdown link syntax
    replaced = replaced.replace(/\[(.*)\]\((.*)\)/g, '$2')

    // strip a tag body
    replaced = replaced.replace(/<a(.*?)>.*?<\/a>/g, '$1')

    // extract urls
    const urls = replaced.match(/(https?:\/\/[\w.\-?=/&%#,@]+)/g)

    if (!urls) return null

    if (props.limit && urls.length > props.limit) {
        urls.length = props.limit
    }

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                py: 1
            }}
        >
            {urls.map((url, i) => {
                return <UrlPreview key={i} url={url} />
            })}
        </Box>
    )
}

export const UrlPreview = (props: { url: string }): JSX.Element | null => {
    const service = useUrlSummary()
    if (!service) return null
    const [preview, setPreview] = useState<Summary | undefined>(undefined)
    const [errored, setErrored] = useState(false)

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
                textDecoration: 'none'
            }}
            component={RouterLink}
            to={props.url}
            target="_blank"
            rel="noopener noreferrer"
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
                    {preview?.description || '説明はありません'}
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
