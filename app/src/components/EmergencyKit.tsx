import { type FallbackProps } from 'react-error-boundary'
import { type Preference, defaultPreference } from '../context/PreferenceContext'

// @ts-expect-error vite dynamic import
import buildTime from '~build/time'
// @ts-expect-error vite dynamic import
import { branch, sha } from '~build/git'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const buttonStyle = {
    backgroundColor: '#0476d9',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
    width: '95%',
    maxWidth: '400px'
}

export function EmergencyKit({ error }: FallbackProps): JSX.Element {
    const { t } = useTranslation('', { keyPrefix: 'emergency' })

    useEffect(() => {
        // do not refresh in 5 minutes
        const lastQuickFix = localStorage.getItem('lastQuickFix')
        if (lastQuickFix) {
            const diff = new Date().getTime() - new Date(lastQuickFix).getTime()
            if (diff < 5 * 60 * 1000) {
                return
            }
        }

        if (
            error?.message.includes('Failed to fetch dynamically imported module') ||
            error?.message.includes("'text/html' is not a valid JavaScript MIME type")
        ) {
            localStorage.setItem('lastQuickFix', new Date().toISOString())
            window.location.reload()
        }
    }, [])

    const gracefulResetLocalStorage = (): void => {
        for (const key in localStorage) {
            if (['Domain', 'PrivateKey', 'SubKey'].includes(key)) continue
            localStorage.removeItem(key)
        }
        window.location.replace('/')
    }

    const resetAllLocalstorage = (): void => {
        for (const key in localStorage) {
            localStorage.removeItem(key)
        }

        window.location.replace('/')
    }

    const resetThemeAndEnterSafemode = (): void => {
        const preference = localStorage.getItem('preference')
        if (preference) {
            const parsed: Preference = JSON.parse(preference)
            parsed.themeName = defaultPreference.themeName
            localStorage.setItem('preference', JSON.stringify(parsed))
        }

        localStorage.setItem('noloadsettings', 'true')

        window.location.replace('/')
    }

    const report = `# Crash Report
Time: ${new Date().toISOString()}
Error: ${error?.message}
Stack: ${error?.stack}
UserAgent: ${navigator.userAgent}
Language: ${navigator.language}
Location: ${window.location.href}
Referrer: ${document.referrer}
Screen: ${window.screen.width}x${window.screen.height}
Viewport: ${window.innerWidth}x${window.innerHeight}

branch: ${branch}
sha: ${sha}
buildTime: ${buildTime.toLocaleString()}`

    const messages: string[] = t('messages', { returnObjects: true })

    return (
        <div
            style={{
                width: '100vw',
                height: '100dvh',
                backgroundColor: '#023059',
                position: 'fixed',
                top: 0,
                left: 0,
                padding: '10px',
                boxSizing: 'border-box',
                overflow: 'auto'
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: '5px',
                    border: '1px solid white',
                    backgroundColor: 'white',
                    gap: '5px',
                    textAlign: 'center'
                }}
            >
                <h1
                    style={{
                        marginBottom: 0
                    }}
                >
                    {t('title')}
                </h1>
                {messages[(messages.length * Math.random()) | 0]}
                <button
                    style={{
                        ...buttonStyle,
                        fontSize: '1.5em',
                        textAlign: 'center',
                        width: '95%',
                        maxWidth: 'unset',
                        padding: '20px'
                    }}
                    onClick={async (): Promise<void> => {
                        localStorage.removeItem('lastQuickFix')

                        // delete all caches
                        if (window.caches) {
                            const keys = await window.caches.keys()
                            await Promise.all(
                                keys.map((key) => {
                                    return window.caches.delete(key)
                                })
                            )
                        }
                        if (window.indexedDB) {
                            await new Promise((resolve) => {
                                const req = window.indexedDB.deleteDatabase('concrnt-client')
                                req.onsuccess = resolve
                                req.onerror = resolve
                            })
                        }
                        window.location.replace('/')
                    }}
                >
                    {t('reload')}
                </button>
                <h2
                    style={{
                        marginBottom: 0
                    }}
                >
                    {t('recoverTools')}
                </h2>
                <div>{t('whenToUseTools')}</div>
                <button style={buttonStyle} onClick={gracefulResetLocalStorage}>
                    {t('softReset')}
                </button>
                <button style={buttonStyle} onClick={resetThemeAndEnterSafemode}>
                    {t('recoverTheme')}
                </button>
                <button
                    style={{
                        ...buttonStyle,
                        backgroundColor: '#d90429'
                    }}
                    onClick={resetAllLocalstorage}
                >
                    {t('hardReset')}
                </button>
                <h2 style={{ marginBottom: 0 }}>{t('support')}</h2>
                {t('supportDesc')}
                <a href="https://discord.gg/M2UbHquT8B">Discord</a>
                <h2
                    style={{
                        marginBottom: 0
                    }}
                >
                    Report
                </h2>
                <button
                    style={buttonStyle}
                    onClick={(): void => {
                        const source =
                            'CxsaEwFUWwETBgEPCxELQAAdA1tPBwZdGwEBBwEMGR1bH0RdRVpVWllbVUtaRBtGVkddUExfLS1DKA5iExolVA00PAg8PV0MAz0COSlVCwI/LEReHxwkFyIFXBVCNlQtPzt3MyIhHC0KIAJVPhslTQcpEC4sMykLOQ=='
                        const key = window.location.hostname
                        const url = window
                            .atob(source)
                            .split('')
                            .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
                            .join('')

                        if (!url.startsWith('https://')) {
                            console.log(url)
                            alert(t('reportFailed'))
                            return
                        }

                        fetch(url, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                content: report
                            })
                        }).then(() => {
                            alert(t('reportSent'))
                            window.location.replace('/')
                        })
                    }}
                >
                    {t('sendAnonymousReport')}
                </button>
                <pre
                    style={{
                        padding: '20px',
                        borderRadius: '5px',
                        overflow: 'auto',
                        width: '95%',
                        boxSizing: 'border-box',
                        border: '1px dashed #aaa',
                        borderStyle: 'dashed',
                        textAlign: 'left'
                    }}
                >
                    {report}
                </pre>
            </div>
        </div>
    )
}
