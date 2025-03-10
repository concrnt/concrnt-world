import { Box, Typography } from '@mui/material'

import { DummyMessageView } from '../Message/DummyMessageView'
import { ErrorBoundary } from 'react-error-boundary'
import HeartBrokenIcon from '@mui/icons-material/HeartBroken'
import { useTranslation } from 'react-i18next'
import { useClient } from '../../context/ClientContext'
import { type EmojiLite } from '../../model'

interface EditorPreviewProps {
    draft: string
    emojiDict: Record<string, EmojiLite>
    selectedSubprofileID?: string
    hideActions?: boolean
}

export const EditorPreview = (props: EditorPreviewProps): JSX.Element => {
    const { t } = useTranslation('', { keyPrefix: 'ui.draft' })
    const { client } = useClient()

    return (
        <ErrorBoundary
            FallbackComponent={({ error }) => (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        py: 2
                    }}
                >
                    <Typography color="error" variant="body2" align="center" display="flex" alignItems="center" gap={1}>
                        <HeartBrokenIcon />
                        {error.message}
                    </Typography>
                </Box>
            )}
        >
            <DummyMessageView
                message={{
                    body: props.draft,
                    emojis: props.emojiDict
                }}
                user={client.user?.profile}
                userCCID={client.user?.ccid}
                subprofileID={props.selectedSubprofileID}
                hideActions={props.hideActions}
                timestamp={
                    <Typography
                        sx={{
                            backgroundColor: 'divider',
                            color: 'primary.contrastText',
                            px: 1,
                            fontSize: '0.75rem'
                        }}
                    >
                        {t('preview')}
                    </Typography>
                }
            />
        </ErrorBoundary>
    )
}
