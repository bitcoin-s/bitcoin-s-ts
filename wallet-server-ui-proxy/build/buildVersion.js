const fs = require('fs')

try {
  const git = require('git-last-commit')

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
    await getGitCommits().then(commit => {
      if (commit) {
        const commitString = JSON.stringify(commit, null, 2)
        fs.writeFileSync('./build.json', commitString, { encoding: 'utf8', flag: 'w' })
      }
    })
  }
  
  writeBuildJSON()
} catch (err) {
  console.error('error in buildVersion.js', err)
}
