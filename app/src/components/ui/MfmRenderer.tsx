import { Box } from '@mui/material'
import { useAutoSummary } from '../../context/AutoSummaryContext'
import { useGlobalState } from '../../context/GlobalState'
import { EmojiLite } from '../../model'
import { MfmRenderer as Renderer } from 'mfm-renderer-react'

export interface MfmRendererProps {
    messagebody: string
    emojiDict: Record<string, EmojiLite>
}

export default function MfmRenderer(props: MfmRendererProps): JSX.Element {
    const summary = useAutoSummary()
    const { getImageURL } = useGlobalState()

    return (
        <Box
            sx={{
                whiteSpace: 'pre-wrap',
                fontSize: {
                    xs: '0.9rem',
                    sm: '1rem'
                }
            }}
        >
            <Renderer
                body={props.messagebody}
                // @ts-ignore
                emojis={props.emojiDict}
                options={{
                    getImageURL: getImageURL,
                    onUpdate: () => {
                        summary.update()
                    }
                }}
            />
        </Box>
    )
}
