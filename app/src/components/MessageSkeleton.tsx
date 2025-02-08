import { Box, ListItem, Skeleton } from '@mui/material'

export const MessageSkeleton = (): JSX.Element => {
    return (
        <ListItem
            sx={{
                alignItems: 'flex-start',
                flex: 1,
                gap: 1.5,
                padding: 0
            }}
        >
            <Skeleton animation="wave" variant="rectangular" sx={{ borderRadius: 1 }} width={40} height={40} />
            <Box sx={{ flex: 1, gap: 1, display: 'flex', flexDirection: 'column' }}>
                <Skeleton animation="wave" variant="rectangular" width="100%" height={20} sx={{ borderRadius: 1 }} />
                <Skeleton animation="wave" variant="rectangular" width="100%" height={50} sx={{ borderRadius: 1 }} />
            </Box>
        </ListItem>
    )
}
