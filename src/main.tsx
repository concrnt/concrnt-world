import ReactDOM from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'
import { EmergencyKit } from './components/EmergencyKit'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LoginGuard } from './utils/LoginGuard'
import { Suspense, lazy } from 'react'
import { FullScreenLoading } from './components/ui/FullScreenLoading'
import { PreferenceProvider } from './context/PreferenceContext'
import { GlobalStateProvider } from './context/GlobalState'
import { ClientProvider } from './context/ClientContext'

import './i18n'
import GuestMessagePage from './pages/GuestMessage'

const AppPage = lazy(() => import('./App'))
const Welcome = lazy(() => import('./pages/Welcome'))
const Registration = lazy(() => import('./pages/Registration'))
const AccountImport = lazy(() => import('./pages/AccountImport'))
const GuestTimelinePage = lazy(() => import('./pages/GuestTimeline'))

let domain = ''
let prvkey = ''
let subkey = ''

try {
    domain = JSON.parse(localStorage.getItem('Domain') || '')
} catch (e) {
    console.error(e)
}

try {
    prvkey = JSON.parse(localStorage.getItem('PrivateKey') || '')
} catch (e) {
    console.error(e)
}

try {
    subkey = JSON.parse(localStorage.getItem('SubKey') || '')
} catch (e) {
    console.error(e)
}

const logined = domain !== '' && (prvkey !== '' || subkey !== '')

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <ErrorBoundary FallbackComponent={EmergencyKit}>
        <Suspense fallback={<FullScreenLoading message="Downloading Updates..." />}>
            <BrowserRouter>
                <Routes>
                    <Route path="/crash" element={<EmergencyKit error={null} resetErrorBoundary={() => {}} />} />
                    <Route path="/welcome" element={<Welcome />} />
                    {!logined ? (
                        <Route path="/register" element={<Registration />} />
                    ) : (
                        <Route path="/register" element={<Navigate to="/" />} />
                    )}
                    <Route path="/import" element={<AccountImport />} />
                    {!logined && <Route path="/:id" element={<GuestTimelinePage page="entity" />} />}
                    {!logined && <Route path="/:authorID/:messageID" element={<GuestMessagePage />} />}
                    {!logined && <Route path="/timeline/:id" element={<GuestTimelinePage page="timeline" />} />}
                    <Route
                        path="*"
                        element={
                            <LoginGuard
                                component={
                                    <ClientProvider>
                                        <PreferenceProvider>
                                            <GlobalStateProvider>
                                                <AppPage />
                                            </GlobalStateProvider>
                                        </PreferenceProvider>
                                    </ClientProvider>
                                }
                                redirect="/welcome"
                            />
                        }
                    />
                </Routes>
            </BrowserRouter>
        </Suspense>
    </ErrorBoundary>
)
