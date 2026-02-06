import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const componentsRoot = path.join(root, 'src', 'components')
const templatesRoot = path.join(root, 'src', 'templates')
const layers = ['atoms', 'molecules', 'organisms']
const namePattern = /^[A-Z][A-Za-z0-9]*$/

const issues = []

const exists = (p) => fs.existsSync(p)
const listDirs = (dir) => (exists(dir)
  ? fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
  : [])
const listFiles = (dir) => (exists(dir)
  ? fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isFile()).map((d) => d.name)
  : [])

if (!exists(componentsRoot)) {
  issues.push('Missing src/components directory.')
} else {
  const topDirs = listDirs(componentsRoot)
  const unexpected = topDirs.filter((dir) => !layers.includes(dir))
  if (unexpected.length) {
    issues.push(`Unexpected directories in src/components: ${unexpected.join(', ')}`)
  }

  layers.forEach((layer) => {
    const layerPath = path.join(componentsRoot, layer)
    if (!exists(layerPath)) {
      issues.push(`Missing layer: src/components/${layer}`)
      return
    }

    const files = listFiles(layerPath)
    if (files.length) {
      issues.push(`Files should not live directly in src/components/${layer}: ${files.join(', ')}`)
    }

    const components = listDirs(layerPath)
    components.forEach((name) => {
      if (!namePattern.test(name)) {
        issues.push(`Component folder name should be PascalCase: ${layer}/${name}`)
      }
      const base = path.join(layerPath, name)
      const jsx = path.join(base, `${name}.jsx`)
      const css = path.join(base, `${name}.css`)
      const index = path.join(base, 'index.js')

      if (!exists(jsx)) {
        issues.push(`Missing file: ${path.relative(root, jsx)}`)
      }
      if (!exists(css)) {
        issues.push(`Missing file: ${path.relative(root, css)}`)
      }
      if (!exists(index)) {
        issues.push(`Missing file: ${path.relative(root, index)}`)
      }

      const directFiles = listFiles(base).filter((file) => !file.endsWith('.test.jsx'))
      const allowed = new Set([`${name}.jsx`, `${name}.css`, 'index.js'])
      directFiles.forEach((file) => {
        if (!allowed.has(file)) {
          issues.push(`Unexpected file in ${layer}/${name}: ${file}`)
        }
      })
    })
  })
}

if (!exists(templatesRoot)) {
  issues.push('Missing src/templates directory.')
} else {
  const templateFiles = listFiles(templatesRoot)
  if (templateFiles.length) {
    issues.push(`Files should not live directly in src/templates: ${templateFiles.join(', ')}`)
  }

  const templates = listDirs(templatesRoot)
  templates.forEach((name) => {
    if (!namePattern.test(name)) {
      issues.push(`Template folder name should be PascalCase: templates/${name}`)
    }
    const base = path.join(templatesRoot, name)
    const jsx = path.join(base, `${name}.jsx`)
    const index = path.join(base, 'index.js')
    if (!exists(jsx)) {
      issues.push(`Missing file: ${path.relative(root, jsx)}`)
    }
    if (!exists(index)) {
      issues.push(`Missing file: ${path.relative(root, index)}`)
    }
  })
}

if (issues.length) {
  console.error('Atomic audit failed:')
  issues.forEach((issue) => console.error(`- ${issue}`))
  process.exitCode = 1
} else {
  console.log('Atomic audit passed.')
}
