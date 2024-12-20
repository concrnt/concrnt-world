import { Schemas } from '@concurrent-world/client'
import { Box, Chip, type SxProps } from '@mui/material'
import { useTranslation } from 'react-i18next'

export interface TimelineFilterProps {
    selected: string | undefined
    setSelected: (value: string | undefined) => void
    sx?: SxProps
}

export const TimelineFilter = (props: TimelineFilterProps): JSX.Element => {
    const { t } = useTranslation('', { keyPrefix: 'common' })

    return (
        <Box
            sx={{
                display: 'flex',
                gap: 1,
                py: 1,
                overflowX: 'auto',
                width: '100%',
                scrollbarWidth: 'none',
                ...props.sx
            }}
        >
            <Chip
                label={t('reply')}
                onClick={() => {
                    props.setSelected(
                        props.selected === Schemas.replyAssociation ? undefined : Schemas.replyAssociation
                    )
                }}
                color="primary"
                variant={props.selected === Schemas.replyAssociation ? 'filled' : 'outlined'}
            />
            <Chip
                label={t('mention')}
                onClick={() => {
                    props.setSelected(
                        props.selected === Schemas.mentionAssociation ? undefined : Schemas.mentionAssociation
                    )
                }}
                color="primary"
                variant={props.selected === Schemas.mentionAssociation ? 'filled' : 'outlined'}
            />
            <Chip
                label={t('reroute')}
                onClick={() => {
                    props.setSelected(
                        props.selected === Schemas.rerouteAssociation ? undefined : Schemas.rerouteAssociation
                    )
                }}
                color="primary"
                variant={props.selected === Schemas.rerouteAssociation ? 'filled' : 'outlined'}
            />
            <Chip
                label={t('fav')}
                onClick={() => {
                    props.setSelected(props.selected === Schemas.likeAssociation ? undefined : Schemas.likeAssociation)
                }}
                color="primary"
                variant={props.selected === Schemas.likeAssociation ? 'filled' : 'outlined'}
            />
            <Chip
                label={t('reaction')}
                onClick={() => {
                    props.setSelected(
                        props.selected === Schemas.reactionAssociation ? undefined : Schemas.reactionAssociation
                    )
                }}
                color="primary"
                variant={props.selected === Schemas.reactionAssociation ? 'filled' : 'outlined'}
            />
        </Box>
    )
}
