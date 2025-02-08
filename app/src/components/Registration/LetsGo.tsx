import { Box, Button } from '@mui/material'
import Tilt from 'react-parallax-tilt'
import { PassportRenderer } from '../theming/Passport'
import { type ProfileSchema } from '@concrnt/worldlib'
import { type Identity } from '@concrnt/client'
import { useTranslation } from 'react-i18next'

export function RegistrationReady(props: {
    next: () => void
    identity: Identity
    profile: ProfileSchema | null
    domain: string
}): JSX.Element {
    const { t } = useTranslation('', { keyPrefix: 'registration.ready' })

    return (
        <>
            <Box
                sx={{
                    padding: '30px',
                    maxWidth: '600px',
                    margin: 'auto'
                }}
            >
                <Tilt glareEnable={true} glareBorderRadius="5%">
                    <PassportRenderer
                        ccid={props.identity.CCID}
                        name={props.profile?.username ?? ''}
                        avatar={props.profile?.avatar ?? ''}
                        host={props.domain}
                        cdate={new Date().toLocaleDateString()}
                        trust={0}
                    />
                </Tilt>
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px'
                }}
            >
                <Button onClick={props.next}>{t('next')}</Button>
            </Box>
        </>
    )
}
