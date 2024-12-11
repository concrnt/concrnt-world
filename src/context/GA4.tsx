import { createContext, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import ReactGA from 'react-ga4'

const GA4Context = createContext({})

interface GA4ProviderProps {
    tag: string
    children: JSX.Element | JSX.Element[]
}

export const GA4Provider = (props: GA4ProviderProps): JSX.Element => {
    const location = useLocation()

    useEffect(() => {
        ReactGA.initialize(props.tag)
    }, [])

    useEffect(() => {
        console.log('page navigated', location.pathname)
        setTimeout(() => {
            ReactGA.send({
                hitType: 'pageview',
                page: location.pathname,
                title: document.title
            })
        }, 100)
    }, [location.pathname])

    return <GA4Context.Provider value={{}}>{props.children}</GA4Context.Provider>
}
