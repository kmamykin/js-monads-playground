import yio from 'yio'
import assert from 'assert'
import {inspect} from 'util'
import github, {getUser, getFollowers} from './effects/github'
import storage, {getItem, setItem, removeItem, clear, mapInterpreter} from './effects/storage'

const run = (script, interpreter) => yio(interpreter, script)

const simulate = (script, interpreter) => {
  let effects = []
  const result = yio(effect => {
    effects = [...effects, effect]
    return interpreter(effect)
  }, script)
  return result.then(r => ({effects, result: r}))
}

const playByPlay = script => {
  const builder = (expectations, result) => ({
    expect: (effect, effectResult) => builder([...expectations, [effect, effectResult]], result),
    returns: r => builder(expectations, r),
    then: (onResolved, onRejected) => {
      yio(effect => {
        const [expectedEffect, expectedResult] = expectations.shift()
        try {
//          console.log('ASSERT actual:', effect, 'expected:', expectedEffect)
          assert.deepEqual(effect, expectedEffect, 'Effects no match')
          return expectedResult instanceof Error ? Promise.reject(expectedResult) : Promise.resolve(expectedResult)
        } catch (err) {
//          console.log('catch(err)', err)
          return Promise.reject(err)
        }
      }, script)
        .then(scriptResult => {
//          console.log('in scriptResult check', scriptResult, expectations)
          assert(expectations.length === 0, `Some expectations left un-yielded: ${inspect(expectations)}`)
          assert.deepEqual(scriptResult, result, 'Results dont match')
          return scriptResult
        })
        .then(onResolved, onRejected)
    }
  })
  return builder([], undefined)
}

function * fetchFollowers (username) {
  const user = yield getUser(username)
  const followers = yield getFollowers(user.followers_url)
  return followers.map(f => f.url)
}

//run(fetchFollowers('kmamykin'), github({})).then(console.log, console.error)

//simulate(fetchFollowers('kmamykin'), effect => {
//  switch (effect.type) {
//    case 'GET_USER':
//      return Promise.resolve({followers_url: `${effect.username}/followers`})
//    case 'GET_FOLLOWERS':
//      return Promise.resolve([{url: 'http://follower1'}, {url: 'http://follower2'}])
//  }
//}).then(({effects, result}) => {
//  assert.deepEqual(effects, [getUser('kmamykin'), getFollowers(`kmamykin/followers`)])
//  assert.deepEqual(result, ['http://follower1', 'http://follower2'])
//}).then(_ => console.log('fetchFollowers tests pass!'))
//  .catch(console.error)

function * transferAmount (from, to, amount) {
  assert(from && from.length > 0, 'from is empty')
  assert(to && to.length > 0, 'to is empty')
  assert(amount > 0, 'amount should be > 0')
  const fromBalance = yield getItem(`accounts:${from}`)
  const toBalance = yield getItem(`accounts:${to}`)
  yield setItem(`accounts:${from}`, fromBalance - amount)
  yield setItem(`accounts:${to}`, toBalance + amount)
  return amount
}

//const state1 = new Map([['accounts:yours', 10000000], ['accounts:mine', 0]])
//simulate(transferAmount('yours', 'mine', 1000), mapInterpreter(state1)).then(console.log).catch(err =>
// console.error(err.stack))

//playByPlay(transferAmount('yours', 'mine', 1000))
//  .expect(getItem(`accounts:yours`), 1000)
//  .expect(getItem(`accounts:mine`), 0)
//  .expect(setItem('accounts:yours', 0))
//  .expect(setItem('accounts:mine', 1000))
//  .returns(1000)
//  .then(console.log, console.error)

import {zipWith, partition} from 'lodash'

function * getMostPopularUsername (...usernames) {
  const cached = yield usernames.map(username => getItem(`users:${username}`))
  const [cachedUsers, notCachedUsers] = partition(zipWith(usernames, cached, (username, followers) => ({
    username,
    followers
  })), u => u.followers)
  const githubUserResponces = yield notCachedUsers.map(u => getUser(u.username))
  const githubUsers = zipWith(notCachedUsers, githubUserResponces, (user, response) => ({
    username: user.username,
    followers: response.followers
  }))
  const sorted = cachedUsers.concat(githubUsers).sort((u1, u2) => u2.followers - u1.followers)
  return sorted.length > 0 ? sorted[0].username : null
}

function * getMostPopularUsername2 (...usernames) {
  const users = []
  for (let username of usernames) {
    const followers = (yield getItem(`users:${username}`)) || (yield getUser(username)).followers
    users.push({username, followers})
  }
  const sorted = users.sort((u1, u2) => u2.followers - u1.followers)
  return sorted.length > 0 ? sorted[0].username : null
}

playByPlay(getMostPopularUsername())
  .returns(null)
  .then(console.log, console.error)

playByPlay(getMostPopularUsername('kmamykin'))
  .expect(getItem('users:kmamykin'), 10)
  .returns('kmamykin')
  .then(console.log, console.error)

playByPlay(getMostPopularUsername('kmamykin'))
  .expect(getItem('users:kmamykin'), null)
  .expect(getUser('kmamykin'), {followers: 10})
  .returns('kmamykin')
  .then(console.log, console.error)

playByPlay(getMostPopularUsername('kmamykin', 'mojombo'))
  .expect(getItem('users:kmamykin'), null)
  .expect(getItem('users:mojombo'), null)
  .expect(getUser('kmamykin'), {followers: 10})
  .expect(getUser('mojombo'), {followers: 1000})
  .returns('mojombo')
  .then(console.log, console.error)

playByPlay(getMostPopularUsername('kmamykin', 'mojombo'))
  .expect(getItem('users:kmamykin'), 10)
  .expect(getItem('users:mojombo'), 1000)
  .returns('mojombo')
  .then(console.log, console.error)

playByPlay(getMostPopularUsername('kmamykin', 'mojombo'))
  .expect(getItem('users:kmamykin'), 10)
  .expect(getItem('users:mojombo'), null)
  .expect(getUser('mojombo'), {followers: 1000})
  .returns('mojombo')
  .then(console.log, console.error)

playByPlay(getMostPopularUsername2('kmamykin', 'mojombo'))
  .expect(getItem('users:kmamykin'), 10)
  .expect(getItem('users:mojombo'), null)
  .expect(getUser('mojombo'), {followers: 1000})
  .returns('mojombo')
  .then(console.log, console.error)
