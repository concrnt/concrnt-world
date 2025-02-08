import { Schemas } from '@concrnt/worldlib'
import { Box, type SxProps } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { CCChip } from './ui/CCChip'

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
            <CCChip
                label={t('reply')}
                onClick={() => {
                    props.setSelected(
                        props.selected === Schemas.replyAssociation ? undefined : Schemas.replyAssociation
                    )
                }}
                variant={props.selected === Schemas.replyAssociation ? 'filled' : 'outlined'}
                color="primary"
            />
            <CCChip
                label={t('mention')}
                onClick={() => {
                    props.setSelected(
                        props.selected === Schemas.mentionAssociation ? undefined : Schemas.mentionAssociation
                    )
                }}
                variant={props.selected === Schemas.mentionAssociation ? 'filled' : 'outlined'}
                color="primary"
            />
            <CCChip
                label={t('reroute')}
                onClick={() => {
                    props.setSelected(
                        props.selected === Schemas.rerouteAssociation ? undefined : Schemas.rerouteAssociation
                    )
                }}
                variant={props.selected === Schemas.rerouteAssociation ? 'filled' : 'outlined'}
                color="primary"
            />
            <CCChip
                label={t('fav')}
                onClick={() => {
                    props.setSelected(props.selected === Schemas.likeAssociation ? undefined : Schemas.likeAssociation)
                }}
                variant={props.selected === Schemas.likeAssociation ? 'filled' : 'outlined'}
                color="primary"
            />
            <CCChip
                label={t('reaction')}
                onClick={() => {
                    props.setSelected(
                        props.selected === Schemas.reactionAssociation ? undefined : Schemas.reactionAssociation
                    )
                }}
                variant={props.selected === Schemas.reactionAssociation ? 'filled' : 'outlined'}
                color="primary"
            />
        </Box>
    )
}
