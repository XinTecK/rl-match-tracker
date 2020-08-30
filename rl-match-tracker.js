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
    name: 'joueurs',
    short: 'j',
    type: 'csv,string'
  },
  {
    name: 'commentaire',
    short: 'c',
    type: 'string'
  }, {
    name: 'help',
    short: 'h',
    type: 'boolean'
  }
]).run()

// Help
if (args.options.help) {
  console.log(clc.bold.blueBright(emoji.get('question') + ' RL-MATCH-TRACKER ' + emoji.get('question') + '\n'))
  console.log(clc.bold('-s') + ' ou ' + clc.bold('--score') + '    =>    Spécifier le score (le score de votre équipe, suivi du score de l\'équipe adverse')
  console.log('    exemple: -s 4,2\n')
  console.log(clc.bold('-j') + ' ou ' + clc.bold('--joueur') + '    => Spécifier les joueurs en plus de vous dans votre équipe')
  console.log('    exemple: -j \'Sabodji\' \'Fleeqq\'\n')
  console.log(clc.bold('-c') + ' ou ' + clc.bold('--commentaire') + '    =>    Ajouter un commentaire à propos du match (comme le nom de l\'équipe, le MMR, le nom du tournoi...')
  console.log('    exemple: -c \'Scrim 1700/1800\'\n')
  console.log(clc.bold.green('Exemple commande complète => ') + 'node rl-match-tracker -s 4,2 -j \'Sabodji\' \'Fleeqq\' -c \'Scrim 1700/1800\'')
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
})

// Insert match
if (args.options.score && args.options.score.length === 2) {
  const insertSql = `INSERT INTO match (team_score, opponent_team_score, players, comment) VALUES (?, ?, ?, ?)`
  const params = [
    args.options.score[0],
    args.options.score[1],
    args.options.joueurs ? args.options.joueurs : '',
    args.options.commentaire ? args.options.commentaire : ''
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
      console.log(clc.green(`${emoji.get('trophy')} ${match.team_score} - ${match.opponent_team_score} `) + `${match.players ? emoji.get('two_men_holding_hands') + ' ' + match.players : ''} ${match.comment ? emoji.get('speech_balloon') + ' ' + match.comment : ''}`)
    } else {
      console.log(clc.red(`${emoji.get('disappointed_relieved')} ${match.team_score} - ${match.opponent_team_score} `) + `${match.players ? emoji.get('two_men_holding_hands') + ' ' + match.players : ''} ${match.comment ? emoji.get('speech_balloon') + ' ' + match.comment : ''}`)
    }
  })
})

// Close database
db.close(err => {
  if (err) {
    console.log(err.message)
  }
})
