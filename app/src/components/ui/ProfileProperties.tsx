import { type Profile } from '@concrnt/client'
import { Box, Button, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CCDrawer } from './CCDrawer'
import { CCEditor } from './cceditor'

export interface ProfilePropertiesProps {
    character: Profile<any>
    showCreateLink?: boolean
}

const defaultProperties = ['username', 'avatar', 'description', 'banner', 'links']

export const ProfileProperties = (props: ProfilePropertiesProps): JSX.Element => {
    const { t } = useTranslation('', { keyPrefix: 'ui.profileProperties' })
    const [schema, setSchema] = useState<any>()
    const [inspecting, setInspecting] = useState(false)

    const properties = useMemo(() => {
        if (!schema) return []
        const specialProperties = schema.properties
        for (const def of defaultProperties) {
            delete specialProperties[def]
        }

        const properties = []
        for (const key in specialProperties) {
            if (specialProperties[key].type !== 'string') continue
            properties.push({
                key,
                title: specialProperties[key].title,
                description: specialProperties[key].description
            })
        }
        return properties
    }, [schema])

    useEffect(() => {
        let unmounted = false
        fetch(props.character.schema, {
            cache: 'force-cache'
        })
            .then((res) => res.json())
            .then((data) => {
                if (unmounted) return
                setSchema(data)
            })
        return () => {
            unmounted = true
        }
    }, [])

    return (
        <>
            <Box>
                {properties.map(
                    (property, index) =>
                        property.key in props.character.parsedDoc.body && (
                            <Box key={index} px={1} mb={1}>
                                <Typography variant="body1">
                                    {property.title}: {props.character.parsedDoc.body[property.key]}
                                </Typography>
                            </Box>
                        )
                )}
                {props.showCreateLink && (
                    <Box
                        display="flex"
                        width="100%"
                        justifyContent="flex-end"
                        px={1}
                        onClick={() => {
                            setInspecting(true)
                        }}
                    >
                        <Typography variant="caption" sx={{ textDecoration: 'underline', cursor: 'pointer' }}>
                            {t('viewTemplate')}
                        </Typography>
                    </Box>
                )}
            </Box>
            <CCDrawer
                open={inspecting}
                onClose={() => {
                    setInspecting(false)
                }}
            >
                <Box p={2}>
                    <Typography variant="h3">{t('templateTitle', { title: schema?.title })}</Typography>
                    <Box>{schema?.description}</Box>
                    <Box mt={2} gap={1} display="flex" flexDirection="column">
                        <Button component={RouterLink} to={`/explorer/users#schema=${props.character.schema}`}>
                            {t('searchCharacters')}
                        </Button>
                        <Button component={RouterLink} to={`/settings/profile#${props.character.schema}`}>
                            {t('createWithTemplate')}
                        </Button>
                        <Button
                            component={RouterLink}
                            to={props.character.schema}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {t('viewSource')}
                        </Button>
                    </Box>
                    {schema && (
                        <CCEditor disabled schema={schema} value={props.character.parsedDoc.body} setValue={() => {}} />
                    )}
                </Box>
            </CCDrawer>
        </>
    )
}
