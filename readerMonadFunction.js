const combineReaders = (r1, r2) => v1 => env => {
  const v2 = r1(v1)(env)
  const v3 = r2(v2)(env)
  return v3
}

// Example 1
const sharedEnv = {
  'first': 'First',
  'second': 'Second',
  'keys': ['first', 'second']
}

const r1 = env => env['first']
console.log(r1(sharedEnv)) // 'First value'

const r2 = env => Object.keys(env)
console.log(r2(sharedEnv)) // [ 'first', 'second', 'keys' ]

console.log(combineReaders((name => env => env[name]), (keys => env => keys.map(key => env[key])))('keys')(sharedEnv)) // [ 'First', 'Second' ]

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

const lookupBand = name => db => db.findBandByName(name)
const artistsForBand = band => db => band.members.map(id => db.getArtist(id))
const greatestMusicians = combineReaders(lookupBand, artistsForBand)('The Beatles')
console.log(greatestMusicians(db))

const combineReaders2 = (r1, r2) => env => r2(r1(env))(env)
const greatestMusicians2 = combineReaders2(lookupBand('The Beatles'), band => artistsForBand(band))
console.log(greatestMusicians2(db))
