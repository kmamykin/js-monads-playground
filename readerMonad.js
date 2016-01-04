// http://adit.io/posts/2013-06-10-three-useful-monads.html

// f :: env -> result
const Reader = f => {
  const run = env => f(env)
  const bind = func => Reader(env => func(run(env)).run(env))
  return { run, bind }
}

// Example 1
const sharedEnv = {
  'first': 'First',
  'second': 'Second',
  'keys': ['first', 'second']
}

const r1 = Reader(env => env['first'])
console.log(r1.run(sharedEnv)) // 'First value'

const r2 = Reader(env => Object.keys(env))
console.log(r2.run(sharedEnv)) // [ 'first', 'second', 'keys' ]

console.log(Reader(env => env['keys']).bind(keys => Reader(env => keys.map(key => env[key]))).run(sharedEnv)) // [ 'First', 'Second' ]

// Example 2
const Database = () => {
  const artists = [
    { id: 1, name: 'Ringo' },
    { id: 2, name: 'John' },
    { id: 3, name: 'George' },
    { id: 4, name: 'Paul' }
  ]
  const bands = [{ id: 1, name: 'The Beatles', members: [1, 2, 3, 4] }]

  return {
    findBandByName: name => bands.find(band => band.name === name),
    getArtist: id => artists.find(artist => artist.id === id)
  }
}

const db = Database() // this is the shared environment

const lookupBand = name => Reader(db => db.findBandByName(name))
const artistsForBand = band => Reader(db => band.members.map(id => db.getArtist(id)))
const greatestBand = Reader(_ => 'The Beatles')
const greatestMusicians = greatestBand.bind(lookupBand).bind(artistsForBand)
console.log(greatestMusicians.run(db))
