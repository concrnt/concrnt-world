import { createContext, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const GA4Context = createContext({})

interface GA4ProviderProps {
    tag: string
    children: JSX.Element | JSX.Element[]
}

export const GA4Provider = (props: GA4ProviderProps): JSX.Element => {
    const location = useLocation()

    useEffect(() => {
        setTimeout(() => {
            const gtag = (window as any).gtag
            if (typeof gtag === 'function') {
                gtag('config', props.tag, {
                    // debug_mode: true,
                    page_path: location.pathname + location.hash,
                    page_title: document.title
                })
            } else {
                console.error('gtag not found')
            }
        }, 100)
    }, [location.pathname, location.hash])

    return <GA4Context.Provider value={{}}>{props.children}</GA4Context.Provider>
}
