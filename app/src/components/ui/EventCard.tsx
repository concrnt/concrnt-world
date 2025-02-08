import { Box, Paper, Typography } from '@mui/material'

export interface EventCardProps {
    id: string
    label: string
    content: any
}

export const EventCard = (props: EventCardProps): JSX.Element => {
    return (
        <Paper
            variant="outlined"
            sx={{
                display: 'flex',
                flexDirection: 'row',
                overflow: 'hidden'
            }}
        >
            <Box
                sx={{
                    width: '40px',
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexShrink: 0
                }}
            >
                <Typography variant="h1">{props.id}</Typography>
            </Box>
            <Box
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Box
                    sx={{
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        pl: 1,
                        py: 0.5
                    }}
                >
                    <Typography variant="h3">{props.label}</Typography>
                </Box>
                <Box
                    sx={{
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        p: 1
                    }}
                >
                    {props.content.map((item: any, index: number) => {
                        return (
                            <Box key={index}>
                                {item.key}: {item.value}
                            </Box>
                        )
                    })}
                </Box>
            </Box>
        </Paper>
    )
}
