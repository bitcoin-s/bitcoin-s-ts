import fs from 'fs'
import path from 'path'

import * as git from 'git-last-commit'

import { loadJSON } from 'common-ts/util/fs-util'


async function getPackageJsonVersion(): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const _dirname = process.cwd()
      const localPath = path.resolve(_dirname, '../oracle-server-ui/package.json')
      const json = loadJSON(localPath)
      resolve(json.version)
    } catch (err) {
      console.error('could not find oracle-server-ui/package.json')
      // Don't fail, just return empty string
      resolve('')
    }
  })
}

async function getGitCommits(): Promise<any> {
  return new Promise((resolve, reject) => {
    let serverCommit
    function pruneCommit(commit: git.Commit) {
      return { shortHash: commit.shortHash, hash: commit.hash, committedOn: parseInt(commit.committedOn) }
    }
    git.getLastCommit((err, commit) => {
      if (err) reject(err)
      serverCommit = commit
      resolve(pruneCommit(serverCommit))
    })
    // Could get UI commit, but they are the same because they are in the same repo
  })
}

async function writeBuildJSON() {
  let versionString = ''
  await getPackageJsonVersion().then(version => {
    versionString = version
  })
  await getGitCommits().then(commit => {
    if (commit) {
      if (versionString) {
        commit.version = versionString
      }
      const commitString = JSON.stringify(commit, null, 2)
      fs.writeFileSync('./build.json', commitString, { encoding: 'utf8', flag: 'w' })
    }
  })
}

try {
  writeBuildJSON()
} catch (err) {
  console.error('error in buildVersion.js', err)
}
