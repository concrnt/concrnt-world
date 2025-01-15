import { type FallbackProps } from 'react-error-boundary'
import { type Preference, defaultPreference } from '../context/PreferenceContext'

// @ts-expect-error vite dynamic import
import buildTime from '~build/time'
// @ts-expect-error vite dynamic import
import { branch, sha } from '~build/info'

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

const messages = [
    'インターネットは素晴らしいものですが、時々問題が発生します。以下のボタンをお試しください。',
    'コンピューターは不思議なものです。再読み込みすると問題が解決するかもしれません。',
    '時には不思議なことが起きますね。この現象を一緒に解決していきましょう。以下のボタンをお試しください。',
    'システムに小さなつまずきがありました。もう一度試すことで乗り越えられるかもしれません。',
    '何かが予定通りに進みませんでした。再読み込みを試してみてください。',
    '一時的にうまく動いていないようです。再読み込みを試してみてください。',
    'おおっと！何かがおかしいようです。再読み込みを試してみてください。'
]

export function EmergencyKit({ error }: FallbackProps): JSX.Element {
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
                    Crash Report
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
                    onClick={(): void => {
                        // delete all caches
                        if (window.caches) {
                            window.caches
                                .keys()
                                .then((keys) => {
                                    return Promise.all(
                                        keys.map((key) => {
                                            return caches.delete(key)
                                        })
                                    )
                                })
                                .then(() => {
                                    window.location.replace('/')
                                })
                        } else {
                            window.location.replace('/')
                        }
                    }}
                >
                    リロード
                </button>
                <h2
                    style={{
                        marginBottom: 0
                    }}
                >
                    Recover tool
                </h2>
                <div>3回くらい再読み込みしても解決しないなら↓</div>
                <button style={buttonStyle} onClick={gracefulResetLocalStorage}>
                    ログイン情報以外をリセットして再読み込み
                </button>
                <button style={buttonStyle} onClick={resetThemeAndEnterSafemode}>
                    テーマをリセットして初回設定同期オフで起動する
                </button>
                <button
                    style={{
                        ...buttonStyle,
                        backgroundColor: '#d90429'
                    }}
                    onClick={resetAllLocalstorage}
                >
                    すべてリセットする(ログイン情報も失われます)
                </button>
                <h2 style={{ marginBottom: 0 }}>Support</h2>
                リロードしても解決しない場合、何か重大な問題が発生中かもしれません。以下のリンクから最新情報を確認できます。
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
                            alert(
                                'レポートの送信に失敗しました(ヒント: このレポートは公式で提供しているもののみ機能します)'
                            )
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
                            alert('クラッシュレポートを送信しました。ありがとうございます！')
                            window.location.replace('/')
                        })
                    }}
                >
                    匿名のクラッシュレポートを送信する
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
