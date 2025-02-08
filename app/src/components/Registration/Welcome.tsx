import { Alert, Box, Button, AlertTitle, Typography } from '@mui/material'
import Tilt from 'react-parallax-tilt'
import { PassportRenderer } from '../theming/Passport'
import { useTranslation } from 'react-i18next'

import LaunchIcon from '@mui/icons-material/Launch'
import { type Identity } from '@concrnt/client'

export function RegistrationWelcome(props: {
    customSetup: () => void
    autoSetup: () => void
    identity: Identity
}): JSX.Element {
    const { t } = useTranslation('', { keyPrefix: 'registration.welcome' })
    return (
        <>
            <Typography
                variant="h4"
                sx={{
                    textAlign: 'center',
                    wordBreak: 'keep-all'
                }}
            >
                {t('desc1')}
                <wbr />
                {t('desc2')}
            </Typography>
            <Box
                sx={{
                    padding: '20px',
                    maxWidth: '500px',
                    margin: 'auto'
                }}
            >
                <Tilt glareEnable={true} glareBorderRadius="5%">
                    <PassportRenderer ccid={props.identity.CCID} name={''} avatar={''} host={''} cdate={''} trust={0} />
                </Tilt>
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '90%',
                    maxWidth: '800px',
                    margin: '0 auto'
                }}
            >
                <Alert severity="info">
                    <AlertTitle>{t('infoTitle')}</AlertTitle>
                    {t('info1')}
                    <br />
                    {t('info2')}
                </Alert>

                <Button
                    id="RegistrationAutoSetupButton"
                    variant="contained"
                    sx={{
                        display: 'flex',
                        gap: 1,
                        p: 1,
                        width: '100%',
                        justifyContent: 'center'
                    }}
                    onClick={props.autoSetup}
                >
                    <Typography>
                        {t('auto1')}
                        <wbr />
                        {t('auto2')}
                    </Typography>
                    <LaunchIcon />
                </Button>
                <Box
                    sx={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'flex-end'
                    }}
                >
                    <Button id="RegistrationCustomButton" variant="text" onClick={props.customSetup}>
                        {t('custom')}
                    </Button>
                </Box>
            </Box>
        </>
    )
}
