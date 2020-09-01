const emoji = require('node-emoji')
const path = require('path')
const argv = require('argv')
const sqlite3 = require('sqlite3').verbose()
const clc = require('cli-color')
const args = argv.option([
  {
    name: 'score',
    short: 's',
    type: 'csv,int'
  },
  {
    name: 'player',
    short: 'p',
    type: 'csv,string'
  },
  {
    name: 'comment',
    short: 'c',
    type: 'string'
  },
  {
    name: 'delete',
    short: 'd',
    type: 'int'
  },
  {
    name: 'help',
    short: 'h',
    type: 'boolean'
  }
]).run()

// Help
if (args.options.help) {
  console.log(clc.bold.blueBright('RL-MATCH-TRACKER\n'))
  console.log(clc.bold('-s') + ' or ' + clc.bold('--score') + '  =>  Specify the score (first your team score, then the opponent team score')
  console.log('    example: -s 4,2\n')
  console.log(clc.bold('-p') + ' or ' + clc.bold('--player') + '  =>  Specify the players (everyone except you)')
  console.log('    example: -j \'Sabodji\' \'Fleeqq\'\n')
  console.log(clc.bold('-c') + ' or ' + clc.bold('--comment') + '  =>  Add a comment related to the match (Like the opponent team name, their MMR average or the match type...')
  console.log('    example: -c \'Scrim 1700/1800\'\n')
  console.log(clc.bold('-d') + ' or ' + clc.bold('--delete') + '  =>  Delete a match (with a specific id)')
  console.log('    example: -d 3\n')
  console.log(clc.bold.cyan('Full list match command example => ') + 'node rl-match-tracker')
  console.log(clc.bold.cyan('Full add match command example => ') + 'node rl-match-tracker -s 4,2 -j \'Sabodji\' \'Fleeqq\' -c \'Scrim 1700/1800\'')
  console.log(clc.bold.cyan('Full delete match command example => ') + 'node rl-match-tracker -d 2')
  process.exit(1)
}

// Database initialization
const initSql = `CREATE TABLE IF NOT EXISTS match (
  match_id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_score INTEGER NOT NULL,
  opponent_team_score INTEGER NOT NULL,
  players VARCHAR(100),
  comment TEXT
);`
const db = new sqlite3.Database(path.join(__dirname, 'tracker.db'))
db.run(initSql, err => {
  if (err) {
    throw err
  }

  // Delete match
  if (args.options.delete) {
    const deleteSql = `DELETE FROM match WHERE match_id = ?`
    const params = [args.options.delete]
    db.run(deleteSql, params, err => {
      if (err) {
        throw err
      }
    })
  }

  // Insert match
  if (args.options.score && args.options.score.length === 2) {
    const insertSql = `INSERT INTO match (team_score, opponent_team_score, players, comment) VALUES (?, ?, ?, ?)`
    const params = [
      args.options.score[0],
      args.options.score[1],
      args.options.player ? args.options.player : '',
      args.options.comment ? args.options.comment : ''
    ]
    db.run(insertSql, params, err => {
      if (err) {
        throw err
      }
    })
  }

  // Get matches
  const selectMatches = `SELECT * FROM match`
  db.all(selectMatches, [], (err, rows) => {
    if (err) {
      throw err
    }
    if (rows.length === 0) {
      console.log('Aucun match ajouté pour le moment...')
    }
    rows.forEach(match => {
      if (match.team_score > match.opponent_team_score) {
        console.log(clc.green(`[${match.match_id}] ${emoji.get('trophy')} ${match.team_score} - ${match.opponent_team_score} `) + `${match.players ? emoji.get('two_men_holding_hands') + ' ' + match.players : ''} ${match.comment ? emoji.get('speech_balloon') + ' ' + match.comment : ''}`)
      } else {
        console.log(clc.red(`[${match.match_id}] ${emoji.get('disappointed_relieved')} ${match.team_score} - ${match.opponent_team_score} `) + `${match.players ? emoji.get('two_men_holding_hands') + ' ' + match.players : ''} ${match.comment ? emoji.get('speech_balloon') + ' ' + match.comment : ''}`)
      }
    })
  })

  // Close database
  db.close(err => {
    if (err) {
      throw err
    }
  })

})
