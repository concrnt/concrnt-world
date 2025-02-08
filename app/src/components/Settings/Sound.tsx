import { Autocomplete, Box, Button, Slider, TextField, Typography } from '@mui/material'
import { defaultPreference, usePreference } from '../../context/PreferenceContext'
import { useTranslation } from 'react-i18next'
import useSound from 'use-sound'
import { useState } from 'react'
import { UseSoundFormats } from '../../constants'

import BubbleSound from '../../resources/Bubble.wav'
import NotificationSound from '../../resources/Notification.wav'
import Bright_Post from '../../resources/Bright_Post.wav'
import Bright_Notification from '../../resources/Bright_Notification.wav'

const soundOptions: Record<string, string> = {
    pop: BubbleSound,
    popi: NotificationSound,
    Bright_Post,
    Bright_Notification
}

const soundOptionLabels = Object.keys(soundOptions)

export const SoundSettings = (): JSX.Element => {
    const [pref, setPref] = usePreference('sound')

    const { t } = useTranslation('', { keyPrefix: 'settings.sound' })

    const [postSoundURL, setPostSoundURL] = useState(pref.post)
    const [notificationSoundURL, setNotificationSoundURL] = useState(pref.notification)

    const [previewPostSound] = useSound(postSoundURL, { volume: pref.volume / 100, format: UseSoundFormats })
    const [previewNotificationSound] = useSound(notificationSoundURL, {
        volume: pref.volume / 100,
        format: UseSoundFormats
    })

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '30px'
            }}
        >
            <Box display="flex" flexDirection="column" gap={1}>
                <Typography variant="h3">{t('sound')}</Typography>
                <Typography variant="h4">{t('volume')}</Typography>
                <Slider
                    aria-label="Volume"
                    value={pref.volume}
                    onChange={(_, value) => {
                        setPref({
                            ...pref,
                            volume: value as number
                        })
                    }}
                />
                <Typography variant="h4">{t('override.title')}</Typography>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: '10px'
                    }}
                >
                    <Autocomplete
                        fullWidth
                        freeSolo
                        defaultValue={Object.entries(soundOptions).find(([_, v]) => v === pref.post)?.[0] ?? pref.post}
                        options={soundOptionLabels}
                        filterOptions={(options, _) => {
                            return options
                        }}
                        onInputChange={(_, value) => {
                            if (!value) return
                            setPref({
                                ...pref,
                                post: soundOptions[value] ?? value
                            })
                            setPostSoundURL(soundOptions[value] ?? value)
                        }}
                        renderInput={(params) => <TextField {...params} label={t('override.postSound')} />}
                    />
                    <Button
                        onClick={() => {
                            previewPostSound()
                        }}
                    >
                        Test
                    </Button>
                </Box>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: '10px'
                    }}
                >
                    <Autocomplete
                        fullWidth
                        freeSolo
                        defaultValue={
                            Object.entries(soundOptions).find(([_, v]) => v === pref.notification)?.[0] ??
                            pref.notification
                        }
                        options={soundOptionLabels}
                        filterOptions={(options, _) => {
                            return options
                        }}
                        onInputChange={(_, value) => {
                            if (!value) return
                            setPref({
                                ...pref,
                                notification: soundOptions[value] ?? value
                            })
                            setNotificationSoundURL(soundOptions[value] ?? value)
                        }}
                        renderInput={(params) => <TextField {...params} label={t('override.notificationSound')} />}
                    />
                    <Button
                        onClick={() => {
                            previewNotificationSound()
                        }}
                    >
                        Test
                    </Button>
                </Box>
            </Box>
            <Button
                onClick={() => {
                    setPref(defaultPreference.sound)
                    setPostSoundURL(defaultPreference.sound.post)
                    setNotificationSoundURL(defaultPreference.sound.notification)
                    window.location.reload()
                }}
            >
                reset
            </Button>
        </Box>
    )
}
