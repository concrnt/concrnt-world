import { alpha, createTheme } from '@mui/material'
import type { ConcurrentTheme } from './model'
import { type DeepPartial } from './util'

export const Themes: Record<string, DeepPartial<ConcurrentTheme>> = {
    blue: {
        meta: {
            name: 'blue',
            author: 'con1t0tey8uxhkqkd4wcp4hd4jedt7f0vfhk29xdd2', // totegamma
            comment: 'コンカレで一番最初に作られたテーマです！'
        },
        palette: {
            primary: {
                main: '#0476d9'
            },
            secondary: {
                main: '#1e6476'
            },
            background: {
                default: '#023059',
                contrastText: '#ffffff'
            }
        }
    },
    blue2: {
        meta: {
            name: 'blue2',
            author: 'con1dlftq82pc75ftccwe8vm8sak5v8jcp565n3p5n', // waonme
            comment: 'コンカレで二番目に作られたわけではないテーマです！'
        },
        palette: {
            primary: {
                main: '#116691'
            },
            secondary: {
                main: '#b3f6ff'
            },
            background: {
                default: '#211a3d',
                paper: '#202c4b',
                contrastText: '#dbfafc'
            },
            text: {
                primary: '#fff',
                secondary: 'rgba(255, 255, 255, 0.8)',
                disabled: 'rgba(255, 255, 255, 0.4)'
            },
            divider: 'rgba(255, 255, 255, 0.2)'
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    '::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '10px'
                    }
                }
            }
        }
    },
    darkgray: {
        meta: {
            name: 'darkgray',
            author: 'con1dlftq82pc75ftccwe8vm8sak5v8jcp565n3p5n', // waonme
            comment: '黒背景よりはダークグレーの方が落ち着くんだ'
        },
        palette: {
            primary: {
                main: '#555',
                contrastText: '#ffffff'
            },
            secondary: {
                main: '#d7d7d7'
            },
            background: {
                default: '#333333',
                paper: '#222',
                contrastText: '#ffffff'
            },
            text: {
                primary: '#fff',
                secondary: 'rgba(255, 255, 255, 0.7)',
                disabled: 'rgba(255, 255, 255, 0.3)'
            },
            divider: 'rgba(255, 255, 255, 0.2)'
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    '::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '10px'
                    }
                }
            }
        },
        shape: {
            borderRadius: 2
        }
    },
    cafe: {
        meta: {
            name: 'cafe',
            author: 'con1dlftq82pc75ftccwe8vm8sak5v8jcp565n3p5n', // waonme
            comment: 'すくなくともスタバではなさそうだ'
        },
        palette: {
            primary: {
                main: '#663741'
            },
            secondary: {
                main: '#663e37'
            },
            background: {
                default: '#a99996',
                paper: '#f7efea',
                contrastText: '#ffffff'
            }
        },
        shape: {
            borderRadius: 2
        }
    },
    rainyday: {
        meta: {
            name: 'rainyday',
            author: 'con1dlftq82pc75ftccwe8vm8sak5v8jcp565n3p5n', // waonme
            comment: 'そういう日もある'
        },
        palette: {
            primary: {
                main: '#70868b'
            },
            secondary: {
                main: '#4d6662'
            },
            background: {
                default: '#839fa1',
                paper: '#ebf3f5',
                contrastText: '#ffffff'
            },
            text: {
                primary: '#232d31',
                secondary: 'rgba(52, 61, 66, 0.7)',
                disabled: 'rgba(0, 0, 0, 0.3)'
            },
            divider: 'rgba(0, 0, 0, 0.2)'
        },
        shape: {
            borderRadius: 0
        }
    },
    sacher: {
        meta: {
            name: 'sacher',
            author: 'con1dlftq82pc75ftccwe8vm8sak5v8jcp565n3p5n', // waonme
            comment:
                '![ザッハさん](https://worldfile.cc/CCBFe6f64AEE52A200B7C47D3D83680A226967d83C/988bf80b-96ca-4bb9-83ff-cd962932b616)'
        },
        palette: {
            primary: {
                main: '#c77e18',
                contrastText: '#fffefa'
            },
            secondary: {
                main: '#4a5a54'
            },
            background: {
                default: '#188aa3',
                paper: '#f6f1e0',
                contrastText: '#fffef8'
            },
            text: {
                primary: '#2e0d03',
                secondary: '#4c6675',
                disabled: 'rgba(0, 0, 0, 0.4)'
            },
            divider: 'rgba(0, 0, 0, 0.2)'
        },
        shape: {
            borderRadius: 3
        }
    },
    astro: {
        meta: {
            name: 'astro',
            author: 'con1t0tey8uxhkqkd4wcp4hd4jedt7f0vfhk29xdd2'
        },
        palette: {
            primary: {
                main: '#92dda2',
                contrastText: '#fff'
            },
            secondary: {
                main: 'rgba(255, 255, 255, 0.8)'
            },
            background: {
                default: '#1c1e2d',
                paper: '#1c1e2d',
                contrastText: '#dbfafc'
            },
            text: {
                primary: '#aadff1',
                secondary: 'rgba(255, 255, 255, 0.8)',
                disabled: 'rgba(170, 223, 241, 0.5)'
            },
            divider: 'rgba(170, 223, 241, 0.12)'
        },
        components: {
            MuiButton: {
                defaultProps: {
                    variant: 'outlined',
                    disableElevation: true
                }
            },
            MuiPaper: {
                defaultProps: {
                    variant: 'outlined'
                }
            },
            MuiAppBar: {
                defaultProps: {
                    color: 'transparent'
                }
            }
        }
    }
}

export const ConcurrentDefaultTheme = {
    palette: {
        primary: {
            main: '#7e7e7e'
        },
        secondary: {
            main: '#737373'
        },
        background: {
            default: '#9e9e9e',
            contrastText: '#ffffff'
        },
        text: {
            primary: '#000000',
            secondary: '#000000',
            disabled: 'rgba(0, 0, 0, 0.5)'
        }
    },
    typography: {
        fontSize: 16,
        body1: {
            fontSize: '1rem'
        },
        h1: {
            fontSize: '1.8em',
            fontWeight: 700,
            lineHeight: 1.5
        },
        h2: {
            fontSize: '1.6em',
            fontWeight: 700,
            lineHeight: 1.5
        },
        h3: {
            fontSize: '1.4em',
            fontWeight: 700,
            lineHeight: 1.5
        },
        h4: {
            fontSize: '1.2em',
            fontWeight: 700
        },
        h5: {
            fontSize: '1em',
            fontWeight: 700
        },
        h6: {
            fontSize: '0.9em',
            fontWeight: 700
        }
    },
    transitions: {
        duration: {
            entieringScreen: 50,
            leavingScreen: 50
        }
    },
    breakpoints: {
        values: {
            xs: 0,
            sm: 550,
            md: 960,
            lg: 1280,
            xl: 1920
        }
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    padding: '4px 16px'
                }
            },
            defaultProps: {
                variant: 'contained'
            }
        },
        MuiCssBaseline: {
            styleOverrides: {
                '::-webkit-scrollbar': {
                    width: '10px',
                    height: '10px'
                },
                '::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '10px'
                },
                html: {
                    overscrollBehaviorY: 'none',
                    fontSize: '16px',
                    userSelect: 'none'
                },
                body: {
                    overflowX: 'hidden',
                    overflowY: 'visible'
                },
                '.snackbar-container-mobile': {
                    bottom: 'calc(55px + env(safe-area-inset-bottom)) !important'
                },
                'p+p, figure+p': {
                    marginTop: '1.3em'
                }
            }
        }
    },
    shape: {
        borderRadius: 4
    }
}

function isObject(item: any): item is object {
    return item && typeof item === 'object' && !Array.isArray(item)
}

export function deepMerge(target: Record<string, any>, source: Record<string, any>): ConcurrentTheme {
    const output = { ...target }

    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach((key: string) => {
            if (isObject(source[key])) {
                if (!(key in target)) Object.assign(output, { [key]: source[key] })
                else output[key] = deepMerge(target[key], source[key])
            } else {
                Object.assign(output, { [key]: source[key] })
            }
        })
    }
    return output as ConcurrentTheme
}

export const createConcurrentThemeFromObject = (base: any, options?: any): ConcurrentTheme => {
    if (base.palette.text !== undefined) {
        if (base.palette.text.hint === undefined) base.palette.text.hint = alpha(base.palette.text.primary, 0.5)
        if (base.palette.text.disabled === undefined) base.palette.text.disabled = alpha(base.palette.text.primary, 0.5)
        if (base.palette.divider === undefined) base.palette.divider = alpha(base.palette.text.primary, 0.12)
    }

    if (base.palette.text?.primary && !base.components)
        base.components = {
            MuiCssBaseline: {
                styleOverrides: {
                    '::-webkit-scrollbar-thumb': {
                        backgroundColor: alpha(base.palette.text.primary, 0.2)
                    }
                }
            }
        }

    const defaultTheme = ConcurrentDefaultTheme
    if (options?.fontSize) {
        defaultTheme.components.MuiCssBaseline.styleOverrides.html.fontSize = `${options.fontSize}px`
    }

    const theme: ConcurrentTheme = deepMerge(defaultTheme, base)
    return createTheme(theme) as ConcurrentTheme
}

export const loadConcurrentTheme = (
    name: string,
    customs: Record<string, DeepPartial<ConcurrentTheme>> = {},
    options?: { fontSize?: number }
): ConcurrentTheme => {
    const base = customs[name] ?? Themes[name] ?? Themes.blue
    return createConcurrentThemeFromObject(base, options)
}
