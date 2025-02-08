import { Navigate, useLocation } from 'react-router-dom'

interface Props {
    component: React.ReactNode
    redirect: string
}

export const LoginGuard = (props: Props): JSX.Element => {
    const domainStr = localStorage.getItem('Domain')
    const prvkeyStr = localStorage.getItem('PrivateKey')
    const subKeyStr = localStorage.getItem('SubKey')

    let redirect = false

    if (domainStr === null || (prvkeyStr === null && subKeyStr === null)) redirect = true

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

    if (domain === '' || (prvkey === '' && subkey === '')) redirect = true

    if (redirect) {
        return <Navigate to={props.redirect} state={{ from: useLocation() }} replace={true} />
    }

    return <>{props.component}</>
}
