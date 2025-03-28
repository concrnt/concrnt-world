start = markdown

newline = "\n" { return {type: 'newline'} }
normalchar = a:[^\n]
space = ' '
codeFence = "```"
spoilerFence = "||"
startSummary = "<summary>"
stopSummary = "</summary>"
startDetails = "<details>"
stopDetails = "</details>"
EOF = !.

markdown = l:(Block / newline)+
{
	return l
}

Block = Heading / Quote / CodeBlock / Details / Line

Summary = startSummary l:(!stopSummary normalchar)* stopSummary newline?
{
    return {
        type: "Summary",
        body: l.map(a=>a[1]).join('')
    }
}

Details = startDetails newline? s:Summary? a:(!stopDetails (Block / newline))* newline? stopDetails (newline / EOF)
{
    return {
        type: "Details",
        summary: s,
        body: a.flat().filter(e => e)
    }
}

CodeBlock = codeFence l:[a-z]* newline c:CodeLines codeFence (newline / EOF)
{
    return {
        type: "CodeBlock",
        lang: l.join(''),
        body: c
    }
}

CodeLines = l:CodeLine*
{
    return l.join('\n')
}

CodeLine = !codeFence a:normalchar* newline
{
    return a.join('')
}

Heading = h:"#"+ space t:InlineElements (newline / EOF)
{
  return {
     type: "Heading",
     level: h.length,
     body: t
  }
}

Quote = ">" space t:InlineElements (newline / EOF)
{
    return {
        type: "Quote",
        body: t
    }
}

Image = "![" a:[^\]]* "](" u:[^)]+ ")"
{
    return {
    	type: "Image",
        alt: a.join(''),
        url: u.join('')
    }
}

EmojiPack = "<emojipack" space* "src" space* "=" space* "\"" body:[^"]+ "\"" space* "/"? ">" "</emojipack>"?
{
    return {
        type: "EmojiPack",
        body: body.join('')
    }
}

InlineCode = "`" a:[^`]+ "`"
{
	return {
    	type: "InlineCode",
        body: a.join('')
    }
}

URL = s:("https://" / "http://") t:[^ 　\n]+
{
    return {
        type: "URL",
        body: s + t.join('')
    }
}

MDURL = "[" a:[^\]]* "](" t:[^)]+ ")"
{
    return {
        type: "URL",
        body: t.join(''),
        alt: a.join('')
    }
}

Emoji = ":" s:[a-zA-Z0-9_]+ ":"
{
    return {
		type: "Emoji",
        body: s.join('')
    }
}

Mention = "@" a:[a-zA-Z0-9@]+
{
	return {
    	type: "Mention",
        body: a.join('')
    }
}

Italic = "*" s:[^\*]+ "*"
{
    return {
        type: "Italic",
        body: s.join('')
    }
}

Bold = "**" s:[^\*]+ "**"
{
    return {
        type: "Bold",
        body: s.join('')
    }
}

BoldItalic = "***" s:[^\*]+ "***"
{
    return {
        type: "BoldItalic",
        body: s.join('')
    }
}

Strike = "~~" s:[^~]+ "~~"
{
    return {
        type: "Strike",
        body: s.join('')
    }
}

Tag = "#" a:[^ \n#]+
{
    const value = a.join('')
    const split = value.split('@')
    if (split.length === 2) {
        return {
            type: "Timeline",
            body: value
        }
    } else {
        return {
            type: "Tag",
            body: value
        }
    }
}

Spoiler = spoilerFence content:(!spoilerFence .)* spoilerFence
{
    return {
        type: "Spoiler",
        body: content.map(c => c[1]).join('')
    }
}


Line = i:InlineElements (newline / EOF)
{
    return i
}

InlineElements = e:HeadElement f:InlineElement*
{
    const body = []
    let textbuf = ""
    for (const elem of [e, f].flat(Infinity)) {
        if (typeof elem === "string") {
            textbuf += elem
        } else {
            if (textbuf !== "") {
                body.push({
                    type: "Text",
                    body: textbuf
                })
                textbuf = ""
            }
            body.push(elem)
        }
    }

    if (textbuf !== "") {
        body.push({
            type: "Text",
            body: textbuf
        })
        textbuf = ""
    }

    return {
        type: "Line",
        body: body
    }
}

HeadElement = (Italic / Bold / BoldItalic / Strike / Image / Spoiler / URL / MDURL / Emoji / InlineCode / EmojiPack / Tag / Mention / normalchar)
InlineElement = (Italic / Bold / BoldItalic / Strike / Image / Spoiler / URL / MDURL / Emoji / InlineCode / EmojiPack / space+ Tag / space+ Mention / normalchar) +

