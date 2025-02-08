import Box from '@mui/material/Box'
import { Suspense, lazy } from 'react'

// TODO: Load on plugin loaded
// import abap from 'react-syntax-highlighter/dist/cjs/languages/prism/abap'
// import abnf from 'react-syntax-highlighter/dist/cjs/languages/prism/abnf'
import actionscript from 'react-syntax-highlighter/dist/cjs/languages/prism/actionscript'
// import ada from 'react-syntax-highlighter/dist/cjs/languages/prism/ada'
// import agda from 'react-syntax-highlighter/dist/cjs/languages/prism/agda'
// import al from 'react-syntax-highlighter/dist/cjs/languages/prism/al'
// import antlr4 from 'react-syntax-highlighter/dist/cjs/languages/prism/antlr4'
import apacheconf from 'react-syntax-highlighter/dist/cjs/languages/prism/apacheconf'
// import apl from 'react-syntax-highlighter/dist/cjs/languages/prism/apl'
import applescript from 'react-syntax-highlighter/dist/cjs/languages/prism/applescript'
// import aql from 'react-syntax-highlighter/dist/cjs/languages/prism/aql'
import arduino from 'react-syntax-highlighter/dist/cjs/languages/prism/arduino'
// import arff from 'react-syntax-highlighter/dist/cjs/languages/prism/arff'
// import asciidoc from 'react-syntax-highlighter/dist/cjs/languages/prism/asciidoc'
// import asm6502 from 'react-syntax-highlighter/dist/cjs/languages/prism/asm6502'
// import aspnet from 'react-syntax-highlighter/dist/cjs/languages/prism/aspnet'
// import autohotkey from 'react-syntax-highlighter/dist/cjs/languages/prism/autohotkey'
// import autoit from 'react-syntax-highlighter/dist/cjs/languages/prism/autoit'
import bash from 'react-syntax-highlighter/dist/cjs/languages/prism/bash'
import basic from 'react-syntax-highlighter/dist/cjs/languages/prism/basic'
// import batch from 'react-syntax-highlighter/dist/cjs/languages/prism/batch'
// import bbcode from 'react-syntax-highlighter/dist/cjs/languages/prism/bbcode'
// import bison from 'react-syntax-highlighter/dist/cjs/languages/prism/bison'
import bnf from 'react-syntax-highlighter/dist/cjs/languages/prism/bnf'
import brainfuck from 'react-syntax-highlighter/dist/cjs/languages/prism/brainfuck'
// import brightscript from 'react-syntax-highlighter/dist/cjs/languages/prism/brightscript'
// import bro from 'react-syntax-highlighter/dist/cjs/languages/prism/bro'
import c from 'react-syntax-highlighter/dist/cjs/languages/prism/c'
// import cil from 'react-syntax-highlighter/dist/cjs/languages/prism/cil'
// import clike from 'react-syntax-highlighter/dist/cjs/languages/prism/clike'
import clojure from 'react-syntax-highlighter/dist/cjs/languages/prism/clojure'
import cmake from 'react-syntax-highlighter/dist/cjs/languages/prism/cmake'
// import coffeescript from 'react-syntax-highlighter/dist/cjs/languages/prism/coffeescript'
// import concurnas from 'react-syntax-highlighter/dist/cjs/languages/prism/concurnas'
// import core from 'react-syntax-highlighter/dist/cjs/languages/prism/core'
import cpp from 'react-syntax-highlighter/dist/cjs/languages/prism/cpp'
// import crystal from 'react-syntax-highlighter/dist/cjs/languages/prism/crystal'
import csharp from 'react-syntax-highlighter/dist/cjs/languages/prism/csharp'
// import csp from 'react-syntax-highlighter/dist/cjs/languages/prism/csp'
// import cssExtras from 'react-syntax-highlighter/dist/cjs/languages/prism/css-extras'
import css from 'react-syntax-highlighter/dist/cjs/languages/prism/css'
// import cypher from 'react-syntax-highlighter/dist/cjs/languages/prism/cypher'
import d from 'react-syntax-highlighter/dist/cjs/languages/prism/d'
import dart from 'react-syntax-highlighter/dist/cjs/languages/prism/dart'
// import dax from 'react-syntax-highlighter/dist/cjs/languages/prism/dax'
// import dhall from 'react-syntax-highlighter/dist/cjs/languages/prism/dhall'
import diff from 'react-syntax-highlighter/dist/cjs/languages/prism/diff'
// import django from 'react-syntax-highlighter/dist/cjs/languages/prism/django'
// import dnsZoneFile from 'react-syntax-highlighter/dist/cjs/languages/prism/dns-zone-file'
import docker from 'react-syntax-highlighter/dist/cjs/languages/prism/docker'
// import ebnf from 'react-syntax-highlighter/dist/cjs/languages/prism/ebnf'
// import editorconfig from 'react-syntax-highlighter/dist/cjs/languages/prism/editorconfig'
// import eiffel from 'react-syntax-highlighter/dist/cjs/languages/prism/eiffel'
// import ejs from 'react-syntax-highlighter/dist/cjs/languages/prism/ejs'
import elixir from 'react-syntax-highlighter/dist/cjs/languages/prism/elixir'
// import elm from 'react-syntax-highlighter/dist/cjs/languages/prism/elm'
// import erb from 'react-syntax-highlighter/dist/cjs/languages/prism/erb'
// import erlang from 'react-syntax-highlighter/dist/cjs/languages/prism/erlang'
// import etlua from 'react-syntax-highlighter/dist/cjs/languages/prism/etlua'
// import excelFormula from 'react-syntax-highlighter/dist/cjs/languages/prism/excel-formula'
// import factor from 'react-syntax-highlighter/dist/cjs/languages/prism/factor'
// import firestoreSecurityRules from 'react-syntax-highlighter/dist/cjs/languages/prism/firestore-security-rules'
// import flow from 'react-syntax-highlighter/dist/cjs/languages/prism/flow'
// import fortran from 'react-syntax-highlighter/dist/cjs/languages/prism/fortran'
// import fsharp from 'react-syntax-highlighter/dist/cjs/languages/prism/fsharp'
// import ftl from 'react-syntax-highlighter/dist/cjs/languages/prism/ftl'
// import gcode from 'react-syntax-highlighter/dist/cjs/languages/prism/gcode'
// import gdscript from 'react-syntax-highlighter/dist/cjs/languages/prism/gdscript'
// import gedcom from 'react-syntax-highlighter/dist/cjs/languages/prism/gedcom'
// import gherkin from 'react-syntax-highlighter/dist/cjs/languages/prism/gherkin'
import git from 'react-syntax-highlighter/dist/cjs/languages/prism/git'
import glsl from 'react-syntax-highlighter/dist/cjs/languages/prism/glsl'
// import gml from 'react-syntax-highlighter/dist/cjs/languages/prism/gml'
import go from 'react-syntax-highlighter/dist/cjs/languages/prism/go'
import graphql from 'react-syntax-highlighter/dist/cjs/languages/prism/graphql'
// import groovy from 'react-syntax-highlighter/dist/cjs/languages/prism/groovy'
import haml from 'react-syntax-highlighter/dist/cjs/languages/prism/haml'
// import handlebars from 'react-syntax-highlighter/dist/cjs/languages/prism/handlebars'
// import haskell from 'react-syntax-highlighter/dist/cjs/languages/prism/haskell'
// import haxe from 'react-syntax-highlighter/dist/cjs/languages/prism/haxe'
import hcl from 'react-syntax-highlighter/dist/cjs/languages/prism/hcl'
import hlsl from 'react-syntax-highlighter/dist/cjs/languages/prism/hlsl'
// import hpkp from 'react-syntax-highlighter/dist/cjs/languages/prism/hpkp'
// import hsts from 'react-syntax-highlighter/dist/cjs/languages/prism/hsts'
import http from 'react-syntax-highlighter/dist/cjs/languages/prism/http'
// import ichigojam from 'react-syntax-highlighter/dist/cjs/languages/prism/ichigojam'
// import icon from 'react-syntax-highlighter/dist/cjs/languages/prism/icon'
// import iecst from 'react-syntax-highlighter/dist/cjs/languages/prism/iecst'
import ignore from 'react-syntax-highlighter/dist/cjs/languages/prism/ignore'
// import inform7 from 'react-syntax-highlighter/dist/cjs/languages/prism/inform7'
import ini from 'react-syntax-highlighter/dist/cjs/languages/prism/ini'
// import io from 'react-syntax-highlighter/dist/cjs/languages/prism/io'
// import j from 'react-syntax-highlighter/dist/cjs/languages/prism/j'
import java from 'react-syntax-highlighter/dist/cjs/languages/prism/java'
// import javadoc from 'react-syntax-highlighter/dist/cjs/languages/prism/javadoc'
// import javadoclike from 'react-syntax-highlighter/dist/cjs/languages/prism/javadoclike'
import javascript from 'react-syntax-highlighter/dist/cjs/languages/prism/javascript'
// import javastacktrace from 'react-syntax-highlighter/dist/cjs/languages/prism/javastacktrace'
// import jolie from 'react-syntax-highlighter/dist/cjs/languages/prism/jolie'
import jq from 'react-syntax-highlighter/dist/cjs/languages/prism/jq'
// import js-extras from 'react-syntax-highlighter/dist/cjs/languages/prism/js-extras'
// import js-templates from 'react-syntax-highlighter/dist/cjs/languages/prism/js-templates'
// import jsdoc from 'react-syntax-highlighter/dist/cjs/languages/prism/jsdoc'
import json from 'react-syntax-highlighter/dist/cjs/languages/prism/json'
// jimport json5 from 'react-syntax-highlighter/dist/cjs/languages/prism/json5'
// import jsonp from 'react-syntax-highlighter/dist/cjs/languages/prism/jsonp'
// import jsstacktrace from 'react-syntax-highlighter/dist/cjs/languages/prism/jsstacktrace'
import jsx from 'react-syntax-highlighter/dist/cjs/languages/prism/jsx'
// import julia from 'react-syntax-highlighter/dist/cjs/languages/prism/julia'
// import keyman from 'react-syntax-highlighter/dist/cjs/languages/prism/keyman'
import kotlin from 'react-syntax-highlighter/dist/cjs/languages/prism/kotlin'
import latex from 'react-syntax-highlighter/dist/cjs/languages/prism/latex'
// import latte from 'react-syntax-highlighter/dist/cjs/languages/prism/latte'
// import less from 'react-syntax-highlighter/dist/cjs/languages/prism/less'
// import lilypond from 'react-syntax-highlighter/dist/cjs/languages/prism/lilypond'
// import liquid from 'react-syntax-highlighter/dist/cjs/languages/prism/liquid'
import lisp from 'react-syntax-highlighter/dist/cjs/languages/prism/lisp'
// import livescript from 'react-syntax-highlighter/dist/cjs/languages/prism/livescript'
import llvm from 'react-syntax-highlighter/dist/cjs/languages/prism/llvm'
// import lolcode from 'react-syntax-highlighter/dist/cjs/languages/prism/lolcode'
import lua from 'react-syntax-highlighter/dist/cjs/languages/prism/lua'
import makefile from 'react-syntax-highlighter/dist/cjs/languages/prism/makefile'
import markdown from 'react-syntax-highlighter/dist/cjs/languages/prism/markdown'
// import markupTemplating from 'react-syntax-highlighter/dist/cjs/languages/prism/markup-templating'
// import markup from 'react-syntax-highlighter/dist/cjs/languages/prism/markup'
import matlab from 'react-syntax-highlighter/dist/cjs/languages/prism/matlab'
import mel from 'react-syntax-highlighter/dist/cjs/languages/prism/mel'
// import mizar from 'react-syntax-highlighter/dist/cjs/languages/prism/mizar'
// import monkey from 'react-syntax-highlighter/dist/cjs/languages/prism/monkey'
// import moonscript from 'react-syntax-highlighter/dist/cjs/languages/prism/moonscript'
// import n1ql from 'react-syntax-highlighter/dist/cjs/languages/prism/n1ql'
// import n4js from 'react-syntax-highlighter/dist/cjs/languages/prism/n4js'
// import nand2tetrisHdl from 'react-syntax-highlighter/dist/cjs/languages/prism/nand2tetris-hdl'
// import nasm from 'react-syntax-highlighter/dist/cjs/languages/prism/nasm'
// import neon from 'react-syntax-highlighter/dist/cjs/languages/prism/neon'
import nginx from 'react-syntax-highlighter/dist/cjs/languages/prism/nginx'
// import nim from 'react-syntax-highlighter/dist/cjs/languages/prism/nim'
// import nix from 'react-syntax-highlighter/dist/cjs/languages/prism/nix'
// import nsis from 'react-syntax-highlighter/dist/cjs/languages/prism/nsis'
import objectivec from 'react-syntax-highlighter/dist/cjs/languages/prism/objectivec'
import ocaml from 'react-syntax-highlighter/dist/cjs/languages/prism/ocaml'
import opencl from 'react-syntax-highlighter/dist/cjs/languages/prism/opencl'
// import oz from 'react-syntax-highlighter/dist/cjs/languages/prism/oz'
// import parigp from 'react-syntax-highlighter/dist/cjs/languages/prism/parigp'
// import parser from 'react-syntax-highlighter/dist/cjs/languages/prism/parser'
// import pascal from 'react-syntax-highlighter/dist/cjs/languages/prism/pascal'
// import pascaligo from 'react-syntax-highlighter/dist/cjs/languages/prism/pascaligo'
// import pcaxis from 'react-syntax-highlighter/dist/cjs/languages/prism/pcaxis'
// import peoplecode from 'react-syntax-highlighter/dist/cjs/languages/prism/peoplecode'
import perl from 'react-syntax-highlighter/dist/cjs/languages/prism/perl'
// import phpExtras from 'react-syntax-highlighter/dist/cjs/languages/prism/php-extras'
import php from 'react-syntax-highlighter/dist/cjs/languages/prism/php'
// import plsql from 'react-syntax-highlighter/dist/cjs/languages/prism/plsql'
// import powerquery from 'react-syntax-highlighter/dist/cjs/languages/prism/powerquery'
// import powershell from 'react-syntax-highlighter/dist/cjs/languages/prism/powershell'
// import processing from 'react-syntax-highlighter/dist/cjs/languages/prism/processing'
import prolog from 'react-syntax-highlighter/dist/cjs/languages/prism/prolog'
// import properties from 'react-syntax-highlighter/dist/cjs/languages/prism/properties'
import protobuf from 'react-syntax-highlighter/dist/cjs/languages/prism/protobuf'
// import pug from 'react-syntax-highlighter/dist/cjs/languages/prism/pug'
// import puppet from 'react-syntax-highlighter/dist/cjs/languages/prism/puppet'
// import pure from 'react-syntax-highlighter/dist/cjs/languages/prism/pure'
// import purebasic from 'react-syntax-highlighter/dist/cjs/languages/prism/purebasic'
import python from 'react-syntax-highlighter/dist/cjs/languages/prism/python'
// import q from 'react-syntax-highlighter/dist/cjs/languages/prism/q'
// import qml from 'react-syntax-highlighter/dist/cjs/languages/prism/qml'
// import qore from 'react-syntax-highlighter/dist/cjs/languages/prism/qore'
import r from 'react-syntax-highlighter/dist/cjs/languages/prism/r'
// import racket from 'react-syntax-highlighter/dist/cjs/languages/prism/racket'
// import reason from 'react-syntax-highlighter/dist/cjs/languages/prism/reason'
// import regex from 'react-syntax-highlighter/dist/cjs/languages/prism/regex'
// import renpy from 'react-syntax-highlighter/dist/cjs/languages/prism/renpy'
// import rest from 'react-syntax-highlighter/dist/cjs/languages/prism/rest'
// import rip from 'react-syntax-highlighter/dist/cjs/languages/prism/rip'
// import roboconf from 'react-syntax-highlighter/dist/cjs/languages/prism/roboconf'
// import robotframework from 'react-syntax-highlighter/dist/cjs/languages/prism/robotframework'
import ruby from 'react-syntax-highlighter/dist/cjs/languages/prism/ruby'
import rust from 'react-syntax-highlighter/dist/cjs/languages/prism/rust'
// import sas from 'react-syntax-highlighter/dist/cjs/languages/prism/sas'
// import sass from 'react-syntax-highlighter/dist/cjs/languages/prism/sass'
// import scala from 'react-syntax-highlighter/dist/cjs/languages/prism/scala'
import scheme from 'react-syntax-highlighter/dist/cjs/languages/prism/scheme'
import scss from 'react-syntax-highlighter/dist/cjs/languages/prism/scss'
// import shellSession from 'react-syntax-highlighter/dist/cjs/languages/prism/shell-session'
// import smali from 'react-syntax-highlighter/dist/cjs/languages/prism/smali'
// import smalltalk from 'react-syntax-highlighter/dist/cjs/languages/prism/smalltalk'
// import smarty from 'react-syntax-highlighter/dist/cjs/languages/prism/smarty'
import solidity from 'react-syntax-highlighter/dist/cjs/languages/prism/solidity'
// import solutionFile from 'react-syntax-highlighter/dist/cjs/languages/prism/solution-file'
// import soy from 'react-syntax-highlighter/dist/cjs/languages/prism/soy'
// import sparql from 'react-syntax-highlighter/dist/cjs/languages/prism/sparql'
import splunkSpl from 'react-syntax-highlighter/dist/cjs/languages/prism/splunk-spl'
// import sqf from 'react-syntax-highlighter/dist/cjs/languages/prism/sqf'
import sql from 'react-syntax-highlighter/dist/cjs/languages/prism/sql'
// import stylus from 'react-syntax-highlighter/dist/cjs/languages/prism/stylus'
import swift from 'react-syntax-highlighter/dist/cjs/languages/prism/swift'
// import t4Cs from 'react-syntax-highlighter/dist/cjs/languages/prism/t4-cs'
// import t4Templating from 'react-syntax-highlighter/dist/cjs/languages/prism/t4-templating'
// import t4Vb from 'react-syntax-highlighter/dist/cjs/languages/prism/t4-vb'
// import tap from 'react-syntax-highlighter/dist/cjs/languages/prism/tap'
import tcl from 'react-syntax-highlighter/dist/cjs/languages/prism/tcl'
// import textile from 'react-syntax-highlighter/dist/cjs/languages/prism/textile'
import toml from 'react-syntax-highlighter/dist/cjs/languages/prism/toml'
// import tsx from 'react-syntax-highlighter/dist/cjs/languages/prism/tsx'
// import tt2 from 'react-syntax-highlighter/dist/cjs/languages/prism/tt2'
// import turtle from 'react-syntax-highlighter/dist/cjs/languages/prism/turtle'
// import twig from 'react-syntax-highlighter/dist/cjs/languages/prism/twig'
import typescript from 'react-syntax-highlighter/dist/cjs/languages/prism/typescript'
// import unrealscript from 'react-syntax-highlighter/dist/cjs/languages/prism/unrealscript'
// import vala from 'react-syntax-highlighter/dist/cjs/languages/prism/vala'
// import vbnet from 'react-syntax-highlighter/dist/cjs/languages/prism/vbnet'
// import velocity from 'react-syntax-highlighter/dist/cjs/languages/prism/velocity'
import verilog from 'react-syntax-highlighter/dist/cjs/languages/prism/verilog'
import vhdl from 'react-syntax-highlighter/dist/cjs/languages/prism/vhdl'
import vim from 'react-syntax-highlighter/dist/cjs/languages/prism/vim'
// import visualBasic from 'react-syntax-highlighter/dist/cjs/languages/prism/visual-basic'
// import warpscript from 'react-syntax-highlighter/dist/cjs/languages/prism/warpscript'
import wasm from 'react-syntax-highlighter/dist/cjs/languages/prism/wasm'
// import wiki from 'react-syntax-highlighter/dist/cjs/languages/prism/wiki'
// import xeora from 'react-syntax-highlighter/dist/cjs/languages/prism/xeora'
// import xmlDoc from 'react-syntax-highlighter/dist/cjs/languages/prism/xml-doc'
// import xojo from 'react-syntax-highlighter/dist/cjs/languages/prism/xojo'
// import xquery from 'react-syntax-highlighter/dist/cjs/languages/prism/xquery'
import yaml from 'react-syntax-highlighter/dist/cjs/languages/prism/yaml'
import materialDark from 'react-syntax-highlighter/dist/cjs/styles/prism/material-dark'
// import yang from 'react-syntax-highlighter/dist/cjs/languages/prism/yang'
// import zig from 'react-syntax-highlighter/dist/cjs/languages/prism/zig'

const SyntaxHighlighter = lazy(() =>
    import('react-syntax-highlighter/dist/cjs/prism-light').then((module) => {
        const PrismLight = module.default
        PrismLight.registerLanguage('actionscript', actionscript)
        PrismLight.registerLanguage('apacheconf', apacheconf)
        PrismLight.registerLanguage('applescript', applescript)
        PrismLight.registerLanguage('arduino', arduino)
        PrismLight.registerLanguage('bash', bash)
        PrismLight.registerLanguage('basic', basic)
        PrismLight.registerLanguage('bnf', bnf)
        PrismLight.registerLanguage('brainfuck', brainfuck)
        PrismLight.registerLanguage('c', c)
        PrismLight.registerLanguage('clojure', clojure)
        PrismLight.registerLanguage('cmake', cmake)
        PrismLight.registerLanguage('cpp', cpp)
        PrismLight.registerLanguage('csharp', csharp)
        PrismLight.registerLanguage('css', css)
        PrismLight.registerLanguage('d', d)
        PrismLight.registerLanguage('dart', dart)
        PrismLight.registerLanguage('diff', diff)
        PrismLight.registerLanguage('docker', docker)
        PrismLight.registerLanguage('elixir', elixir)
        PrismLight.registerLanguage('git', git)
        PrismLight.registerLanguage('glsl', glsl)
        PrismLight.registerLanguage('go', go)
        PrismLight.registerLanguage('graphql', graphql)
        PrismLight.registerLanguage('haml', haml)
        PrismLight.registerLanguage('hcl', hcl)
        PrismLight.registerLanguage('hlsl', hlsl)
        PrismLight.registerLanguage('http', http)
        PrismLight.registerLanguage('ignore', ignore)
        PrismLight.registerLanguage('ini', ini)
        PrismLight.registerLanguage('java', java)
        PrismLight.registerLanguage('javascript', javascript)
        PrismLight.registerLanguage('jq', jq)
        PrismLight.registerLanguage('json', json)
        PrismLight.registerLanguage('jsx', jsx)
        PrismLight.registerLanguage('kotlin', kotlin)
        PrismLight.registerLanguage('latex', latex)
        PrismLight.registerLanguage('lisp', lisp)
        PrismLight.registerLanguage('llvm', llvm)
        PrismLight.registerLanguage('lua', lua)
        PrismLight.registerLanguage('makefile', makefile)
        PrismLight.registerLanguage('markdown', markdown)
        PrismLight.registerLanguage('matlab', matlab)
        PrismLight.registerLanguage('mel', mel)
        PrismLight.registerLanguage('nginx', nginx)
        PrismLight.registerLanguage('objectivec', objectivec)
        PrismLight.registerLanguage('ocaml', ocaml)
        PrismLight.registerLanguage('opencl', opencl)
        PrismLight.registerLanguage('perl', perl)
        PrismLight.registerLanguage('php', php)
        PrismLight.registerLanguage('prolog', prolog)
        PrismLight.registerLanguage('protobuf', protobuf)
        PrismLight.registerLanguage('python', python)
        PrismLight.registerLanguage('r', r)
        PrismLight.registerLanguage('ruby', ruby)
        PrismLight.registerLanguage('rust', rust)
        PrismLight.registerLanguage('scheme', scheme)
        PrismLight.registerLanguage('scss', scss)
        PrismLight.registerLanguage('solidity', solidity)
        PrismLight.registerLanguage('splunkSpl', splunkSpl)
        PrismLight.registerLanguage('sql', sql)
        PrismLight.registerLanguage('swift', swift)
        PrismLight.registerLanguage('tcl', tcl)
        PrismLight.registerLanguage('toml', toml)
        PrismLight.registerLanguage('typescript', typescript)
        PrismLight.registerLanguage('verilog', verilog)
        PrismLight.registerLanguage('vhdl', vhdl)
        PrismLight.registerLanguage('vim', vim)
        PrismLight.registerLanguage('wasm', wasm)
        PrismLight.registerLanguage('yaml', yaml)

        return { default: PrismLight }
    })
)

export interface CodeblockProps {
    language: string
    children: string
}

export function Codeblock(props: CodeblockProps): JSX.Element {
    return (
        <Box
            sx={{
                borderRadius: 1,
                overflow: 'hidden'
            }}
        >
            <Suspense fallback={<div>Loading...</div>}>
                <SyntaxHighlighter
                    style={materialDark}
                    language={props.language}
                    PreTag="div"
                    customStyle={{ margin: 0, padding: '10px 15px', overflow: 'auto' }}
                    codeTagProps={{ style: { fontFamily: 'Source Code Pro, monospace' } }}
                >
                    {props.children}
                </SyntaxHighlighter>
            </Suspense>
        </Box>
    )
}
