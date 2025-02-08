import { Typography, ButtonBase, type SvgIconTypeMap, Tooltip, Box } from '@mui/material'
import { type OverridableComponent } from '@mui/material/OverridableComponent'
import { Link as RouterLink } from 'react-router-dom'

export const IconButtonWithLabel = (props: {
    icon: OverridableComponent<SvgIconTypeMap<unknown, 'svg'>>
    label: string
    link?: boolean
    to?: string
    onClick?: () => void
    disabled?: boolean
    disableMessage?: string
}): JSX.Element => {
    return (
        <Tooltip title={props.disabled ? props.disableMessage : ''} arrow>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <ButtonBase
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        color: 'primary.main',
                        p: 1,
                        borderRadius: 1,
                        height: '80px',
                        width: '80px'
                    }}
                    component={props.link ? RouterLink : 'button'}
                    to={props.to}
                    onClick={props.onClick}
                    disabled={props.disabled}
                >
                    <props.icon
                        sx={{
                            fontSize: '40px',
                            color: props.disabled ? 'text.disabled' : 'text.primary'
                        }}
                    />
                    <Typography
                        color="text.primary"
                        sx={{
                            wordBreak: 'keep-all'
                        }}
                    >
                        {props.label}
                    </Typography>
                </ButtonBase>
            </Box>
        </Tooltip>
    )
}
