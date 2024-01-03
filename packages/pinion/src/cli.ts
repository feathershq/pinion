import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, readFileSync } from 'fs'
import { Command } from 'commander'

import { getContext } from './core'
import { loadModule } from './utils'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const { version } = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'))
const BASE_ACTIONS = ['help', '--help', '-h', '--version', '-V']

export const cli = async (cmd: string[]) => {
  const [generatorFile, ...argRest] = cmd
  const program = new Command()

  program.name('pinion').description('The Pinion CLI')
  program.command('<file> [args...]').description('Run a generator file with command line arguments.')
  program.version(version)

  if (!generatorFile || BASE_ACTIONS.includes(generatorFile)) {
    return program.parse(cmd, {
      from: 'user'
    })
  }

  if (!generatorFile) {
    throw new Error('Please specify a generator file name')
  }

  const moduleName = join(process.cwd(), generatorFile)

  if (!existsSync(moduleName)) {
    throw new Error(`The generator file ${name} does not exists`)
  }

  const { command, generate } = await loadModule(moduleName)
  const commander: Command = typeof command === 'function' ? await command(new Command()) : new Command()
  const args = commander.parse(argRest, {
    from: 'user'
  })
  const generatorContext = getContext(args.opts(), {})

  if (typeof generate !== 'function') {
    throw new Error('The generator file must export a generate function')
  }

  return generate(generatorContext)
}
