const fs = require('fs')
const path = require('path')

try {
  const git = require('git-last-commit')

  async function getPackageJsonVersion() {
    return new Promise((resolve, reject) => {
      try {
        // Will throw error if file does not exist
        const localPath = path.resolve(__dirname, '../../wallet-server-ui/package.json')
        fs.accessSync(localPath)
        const version = require(localPath).version
        resolve(version)
      } catch (err) {
        console.error('could not find wallet-server-ui/package.json')
        // Don't fail, just return empty string
        resolve('')
      }
    })
  }

  async function getGitCommits() {
    return new Promise((resolve, reject) => {
      let serverCommit
      function pruneCommit(commit) {
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
  
  writeBuildJSON()
} catch (err) {
  console.error('error in buildVersion.js', err)
}
