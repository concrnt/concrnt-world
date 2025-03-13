import { compile } from 'npm:json-schema-to-typescript'
import { Schemas } from './src/schemas.ts'

const encoder = new TextEncoder()

for (const elem in Schemas) {
    console.log('fetching', elem, Schemas[elem])
    const schema = await fetch(Schemas[elem]).then((data) => data.json())
    schema['$id'] = elem + 'Schema'
    const targetPath = `./src/schemas/${elem}.ts`
    await compile(schema as any, elem).then((ts) => {
        console.log(`writing ${targetPath}`)
        Deno.writeFile(targetPath, encoder.encode(ts))
    })
    console.log('done.')
}
