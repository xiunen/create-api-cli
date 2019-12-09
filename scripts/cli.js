#!/usr/bin/env node

const path = require('path')
const fs = require('fs')
const childProcess = require('child_process')
const cwd = process.cwd()

const repo = `https://github.com/xiunen/awesome-api.git`;
const repoDir = path.join(__dirname, '../.repo')


let lock = {};
const lockDir = `${cwd}/api.lock.json`
if (fs.existsSync(lockDir)) {
  lock = require(lockDir)
}

const lockFile = (key) => {
  lock[key] = true
  fs.writeFileSync(lockDir, JSON.stringify(lock))
}

const mkdir = (dirs = []) => {
  if (typeof dirs === 'string') {
    dirs = dirs.split('/')
  }

  for (let i = 0; i < dirs.length; i++) {
    const subdir = dirs.slice(0, i + 1).join('/')
    const dir = path.join(cwd, subdir)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }
  }
}

const copyConfig = (force) => {
  if (lock.config && !force) return;
  installDependency(force)
  childProcess.spawn('cp', [`${repoDir}/.sequelizerc`, cwd])
  mkdir('config')
  childProcess.spawn('cp', [`${repoDir}/config/database.json`, `${cwd}/config/database.json.example`])
  lockFile('config')
}

const copyMigration = (force) => {
  if (lock.migration && !force) return;
  installDependency(force)
  mkdir("db")
  const migDir = `db/migrations`
  childProcess.spawn('cp', ['-r', `${repoDir}/${migDir}`, `${cwd}/db`])
  lockFile('migration')
}

const copyModel = (force) => {
  if (lock.model && !force) return;
  installDependency(force)
  const dir = 'app/models'
  mkdir(dir)
  childProcess.spawn('cp', ['-r', `${repoDir}/${dir}`, `${cwd}/app`])
  lockFile('model')
}

const copyController = (force) => {
  if (lock.controller && !force) return;
  installDependency(force)

  const dir = 'app/controllers'
  mkdir(dir)
  childProcess.spawn('cp', ['-r', `${repoDir}/${dir}`, `${cwd}/app`])

  const servdir = `app/services`
  childProcess.spawn('cp', ['-r', `${repoDir}/${servdir}`, `${cwd}/app`])

  const constdir = `app/constants`
  childProcess.spawn('cp', ['-r', `${repoDir}/${constdir}`, `${cwd}/app`])

  const utildir = `app/utils`
  childProcess.spawn('cp', ['-r', `${repoDir}/${utildir}`, `${cwd}/app`])

  lockFile('controller')
}

const copyRouter = (force) => {
  if (lock.router && !force) return;
  installDependency(force)

  const dir = 'app/routers'
  mkdir(dir)
  childProcess.spawn('cp', ['-r', `${repoDir}/${dir}`, `${cwd}/app`])

  lockFile('router')
}

const copyIndex = (force) => {
  if (lock.index && !force) return;
  installDependency(force)

  const dir = 'app'
  mkdir(dir)
  childProcess.spawn('cp', [`${repoDir}/${dir}/index.js`, `${cwd}/${dir}/index.js`])
  lockFile('index')
}

const installDependency = (force) => {
  if (lock.denpency && !force) return;
  const package = require(`${cwd}/package.json`)
  const repoPackage = require(`${repoDir}/package.json`)
  package.dependencies = package.dependencies || {}
  Object.assign(package.dependencies, repoPackage.dependencies)
  package.devDependencies = package.devDependencies || {}
  Object.assign(package.devDependencies, repoPackage.devDependencies)

  fs.writeFileSync(`${cwd}/package.json`, JSON.stringify(package, false, '\t'))

  const yarn = childProcess.spawn('yarn', ['install'])

  yarn.stdout.on('data', (data) => {
    console.log('stdout', data.toString())
  })
  yarn.stderr.on('data', (data) => {
    console.log('stderr', data.toString())
  })
  yarn.on('error', (data) => {
    console.log('error', data.toString())
    childProcess.spawn('npm', ['install'])
  })

  lockFile('denpency')
}

const install = (force) => {
  installDependency();
  copyConfig(force)
  copyMigration(force)
  copyModel(force)
  copyRouter(force)
  copyController(force)
  copyIndex(force)
}


const start = () => {
  const argv = require('minimist')(process.argv.slice(2));
  const force = argv.f
  const cmds = argv._

  if (!cmds.length) {
    install(force)
  } else {
    if (cmds.includes('config')) {
      copyConfig(force)
    }


    if (cmds.includes('migration')) {
      copyMigration(force)
    }


    if (cmds.includes('model')) {
      copyModel(force)
    }


    if (cmds.includes('router')) {
      copyRouter(force)
    }


    if (cmds.includes('controller')) {
      copyController(force)
    }

    if (cmds.includes('index')) {
      copyIndex(force)
    }
  }
}


const repoExist = fs.existsSync(`${repoDir}/package.json`)
if (!repoExist) {
  const git = childProcess.spawn('git', ['clone', repo, repoDir])
  git.on('close', code => {
    if (!code) {
      start()
    }
  })
} else {
  start();
}