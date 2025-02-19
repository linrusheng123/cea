import { readFileSync } from 'fs'
import TypeDoc from 'typedoc'

type PackageRefs = {
  path: string
}

type TSConfigJSON = {
  references: Array<PackageRefs>
}

async function main() {
  const tsconfigRaw = readFileSync('tsconfig.json', 'utf8')
  let tsconfig: TSConfigJSON
  if (tsconfigRaw) {
    tsconfig = JSON.parse(tsconfigRaw)
  } else {
    console.error('tsconfig not found!')
    return
  }

  const pkgRefs: Array<PackageRefs> = tsconfig.references
  const isPluginPackage = (is: boolean) =>
    ({ path }: any) =>
      is ? path.includes('/plugins/') : !path.includes('/plugins/')

  // asynchronizedly build non-plugins api docs
  build(pkgRefs.filter(isPluginPackage(false)))
  // asynchronizedly build plugins api docs
  build(pkgRefs.filter(isPluginPackage(true)))
}

function build(refs: Array<PackageRefs>) {
  for (const { path } of refs) {
    const app = new TypeDoc.Application()
    // If you want TypeDoc to load tsconfig.json / typedoc.json files
    app.options.addReader(new TypeDoc.TSConfigReader())
    app.options.addReader(new TypeDoc.TypeDocReader())
    const pkgName = path.slice(1)
    app.bootstrap({
      // typedoc options here
      entryPoints: [`${path}src/index.ts`],
    })

    const project = app.convert()

    if (project) {
      // Project may not have converted correctly
      const outputDir = `docs/api${pkgName}`
      // Rendered docs
      app.generateDocs(project, outputDir)
    }
  }
}
main().catch(console.error)
