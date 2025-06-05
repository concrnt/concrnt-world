import { Divider, Tab, Tabs, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { RepositoryExportButton, RepositoryImportButton } from '../RepositoryManageButtons'
import { Migrator } from '../Migrator'
import { useParams, useNavigate } from 'react-router-dom'

export function ImportExport(): JSX.Element {
    const { t } = useTranslation('', { keyPrefix: 'settings.importexport' })
    const { tab } = useParams()
    const navigate = useNavigate()

    return (
        <>
            <Tabs
                value={tab}
                onChange={(_, v) => {
                    navigate(`/settings/importexport/${v}`)
                }}
            >
                <Tab value={'manage'} label={t('manageTab')} />
                <Tab value={'migrate'} label={t('migrateTab')} />
            </Tabs>
            <Divider sx={{ mb: 2 }} />

            {tab === 'manage' && (
                <>
                    <Typography variant="h3">{t('export')}</Typography>
                    <RepositoryExportButton />

                    <Divider
                        sx={{
                            marginY: 2
                        }}
                    />

                    <Typography variant="h3">{t('import')}</Typography>
                    <RepositoryImportButton />
                </>
            )}

            {tab === 'migrate' && <Migrator />}
        </>
    )
}
