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
import { HelmetProvider } from 'react-helmet-async'

import './i18n'
import { GA4Provider } from './context/GA4'
import { ConcrntThemeProvider } from './context/Theme'
import AuthorizePage from './pages/Authorize'
import { SnackbarProvider } from 'notistack'

const AppPage = lazy(() => import('./App'))
const Welcome = lazy(() => import('./pages/Welcome'))
const Invitation = lazy(() => import('./pages/Invitation'))
const Registration = lazy(() => import('./pages/Registration'))
const AccountImport = lazy(() => import('./pages/AccountImport'))
const GuestTimelinePage = lazy(() => import('./pages/GuestTimeline'))
const GuestMessagePage = lazy(() => import('./pages/GuestMessage'))
const GuestProfilePage = lazy(() => import('./pages/GuestProfile'))

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

const tag = 'G-Y4V0V7XYWX'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <ErrorBoundary FallbackComponent={EmergencyKit}>
        <Suspense fallback={<FullScreenLoading message="Downloading Updates..." />}>
            <HelmetProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/crash" element={<EmergencyKit error={null} resetErrorBoundary={() => {}} />} />
                        <Route
                            path="/welcome"
                            element={
                                <GA4Provider tag={tag}>
                                    <Welcome />
                                </GA4Provider>
                            }
                        />
                        <Route
                            path="/authorize"
                            element={
                                <ClientProvider noloading>
                                    <AuthorizePage />
                                </ClientProvider>
                            }
                        />
                        {!logined ? (
                            <>
                                <Route
                                    path="/register"
                                    element={
                                        <GA4Provider tag={tag}>
                                            <Registration />
                                        </GA4Provider>
                                    }
                                />
                                <Route
                                    path="/invitation"
                                    element={
                                        <GA4Provider tag={tag}>
                                            <Invitation />
                                        </GA4Provider>
                                    }
                                />
                            </>
                        ) : (
                            <>
                                <Route path="/register" element={<Navigate to="/" />} />
                                <Route path="/invitation" element={<Navigate to="/" />} />
                            </>
                        )}
                        <Route
                            path="/import"
                            element={
                                <GA4Provider tag={tag}>
                                    <SnackbarProvider preventDuplicate>
                                        <AccountImport />
                                    </SnackbarProvider>
                                </GA4Provider>
                            }
                        />
                        {!logined && (
                            <>
                                <Route
                                    path="/:id"
                                    element={
                                        <GA4Provider tag={tag}>
                                            <GuestProfilePage />
                                        </GA4Provider>
                                    }
                                />
                                <Route
                                    path="/:id/profile/:profileid"
                                    element={
                                        <GA4Provider tag={tag}>
                                            <GuestProfilePage />
                                        </GA4Provider>
                                    }
                                />
                                <Route
                                    path="/:authorID/:messageID"
                                    element={
                                        <GA4Provider tag={tag}>
                                            <GuestMessagePage />
                                        </GA4Provider>
                                    }
                                />
                                <Route
                                    path="/timeline/:id"
                                    element={
                                        <GA4Provider tag={tag}>
                                            <GuestTimelinePage />
                                        </GA4Provider>
                                    }
                                />
                            </>
                        )}
                        <Route
                            path="*"
                            element={
                                <GA4Provider tag={tag}>
                                    <LoginGuard
                                        component={
                                            <ClientProvider>
                                                <PreferenceProvider>
                                                    <ConcrntThemeProvider>
                                                        <GlobalStateProvider>
                                                            <AppPage />
                                                        </GlobalStateProvider>
                                                    </ConcrntThemeProvider>
                                                </PreferenceProvider>
                                            </ClientProvider>
                                        }
                                        redirect="/welcome"
                                    />
                                </GA4Provider>
                            }
                        />
                    </Routes>
                </BrowserRouter>
            </HelmetProvider>
        </Suspense>
    </ErrorBoundary>
)
