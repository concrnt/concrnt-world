import { Box, SwipeableDrawer, styled } from '@mui/material'
import grey from '@mui/material/colors/grey'
import { useGlobalState } from '../../context/GlobalState'

export interface CCDrawerProps {
    children?: JSX.Element | JSX.Element[]
    open: boolean
    onOpen?: () => void
    onClose?: () => void
}

const Puller = styled(Box)(({ theme }) => ({
    width: '30px',
    height: '6px',
    backgroundColor: theme.palette.mode === 'light' ? grey[300] : grey[900],
    borderRadius: '3px',
    position: 'absolute',
    top: '7px',
    left: 'calc(50% - 15px)'
}))

export const CCDrawer = (props: CCDrawerProps): JSX.Element => {
    const { isMobileSize } = useGlobalState()

    return (
        <SwipeableDrawer
            disableSwipeToOpen
            anchor={isMobileSize ? 'bottom' : 'right'}
            open={props.open}
            onOpen={() => {
                props.onOpen?.()
            }}
            onClose={() => {
                props.onClose?.()
            }}
            PaperProps={{
                sx: {
                    display: 'flex',
                    flexDirection: 'column',
                    width: {
                        xs: '100%',
                        sm: '50%'
                    },
                    minWidth: {
                        sm: '420px'
                    },
                    maxWidth: {
                        sm: '500px'
                    },
                    height: {
                        xs: '80vh',
                        sm: '100%'
                    },
                    borderRadius: {
                        xs: '10px 10px 0 0',
                        sm: '10px 0 0 10px'
                    }
                }
            }}
        >
            <Box display={isMobileSize ? 'flex' : 'none'} height="20px" width="100%" position="relative">
                <Puller />
            </Box>
            <Box
                sx={{
                    overflowX: 'hidden',
                    overflowY: 'auto',
                    flex: 1
                }}
                onTouchStart={(e) => {
                    e.stopPropagation()
                }}
            >
                {props.children}
            </Box>
        </SwipeableDrawer>
    )
}
