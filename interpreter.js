import yio from 'yio'
import assert from 'assert'
import {inspect} from 'util'
import github, {run as runGithub} from './effects/github'
import storage, {run as runStorage, runOnMap} from './effects/storage'

// each interpreter is (effect) => Promise
const combineInterpreters = (...interpreters) => interpreters.reduce((combined, interpreter) => {
  return effect => combined(effect) || interpreter(effect)
})
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
        try {
//          console.log('expectations', expectations)
          assert(expectations.length > 0, `No more expectations left and effect yielded: ${inspect(effect)}`)
          const [expectedEffect, expectedResult] = expectations.shift()
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
  const user = yield github.getUser(username)
  const followers = yield github.getFollowers(user.followers_url)
  return followers.map(f => f.url)
}

//run(fetchFollowers('kmamykin'), runGithub({})).then(console.log, console.error)

function * transferAmount (from, to, amount) {
  assert(from && from.length > 0, 'from is empty')
  assert(to && to.length > 0, 'to is empty')
  assert(amount > 0, 'amount should be > 0')
  const fromBalance = yield storage.getItem(`accounts:${from}`)
  const toBalance = yield storage.getItem(`accounts:${to}`)
  yield storage.setItem(`accounts:${from}`, fromBalance - amount)
  yield storage.setItem(`accounts:${to}`, toBalance + amount)
  return amount
}

//const state1 = new Map([['accounts:yours', 10000000], ['accounts:mine', 0]])
//simulate(transferAmount('yours', 'mine', 1000), runOnMap(state1)).then(console.log).catch(console.error)
//
//playByPlay(transferAmount('yours', 'mine', 1000))
//  .expect(storage.getItem(`accounts:yours`), 1000)
//  .expect(storage.getItem(`accounts:mine`), 0)
//  .expect(storage.setItem('accounts:yours', 0))
//  .expect(storage.setItem('accounts:mine', 1000))
//  .returns(1000)
//  .then(console.log, console.error)

import {zipWith, partition} from 'lodash'

function * getMostPopularUsername (...usernames) {
  const cached = yield usernames.map(username => storage.getItem(`users:${username}`))
  const [cachedUsers, notCachedUsers] = partition(zipWith(usernames, cached, (username, followers) => ({
    username,
    followers
  })), u => u.followers)
  const githubUserResponces = yield notCachedUsers.map(u => github.getUser(u.username))
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
    let followers = yield storage.getItem(`users:${username}`)
    if (!followers) {
      followers = (yield github.getUser(username)).followers
      yield storage.setItem(`users:${username}`, followers)
    }
    users.push({username, followers})
  }
  const sorted = users.sort((u1, u2) => u2.followers - u1.followers)
  return sorted.length > 0 ? sorted[0].username : null
}

//playByPlay(getMostPopularUsername())
//  .returns(null)
//  .then(console.log, console.error)
//
//playByPlay(getMostPopularUsername('kmamykin'))
//  .expect(storage.getItem('users:kmamykin'), 10)
//  .returns('kmamykin')
//  .then(console.log, console.error)
//
//playByPlay(getMostPopularUsername('kmamykin'))
//  .expect(storage.getItem('users:kmamykin'), null)
//  .expect(github.getUser('kmamykin'), {followers: 10})
//  .returns('kmamykin')
//  .then(console.log, console.error)
//
//playByPlay(getMostPopularUsername('kmamykin', 'mojombo'))
//  .expect(storage.getItem('users:kmamykin'), null)
//  .expect(storage.getItem('users:mojombo'), null)
//  .expect(github.getUser('kmamykin'), {followers: 10})
//  .expect(github.getUser('mojombo'), {followers: 1000})
//  .returns('mojombo')
//  .then(console.log, console.error)
//
//playByPlay(getMostPopularUsername('kmamykin', 'mojombo'))
//  .expect(storage.getItem('users:kmamykin'), 10)
//  .expect(storage.getItem('users:mojombo'), 1000)
//  .returns('mojombo')
//  .then(console.log, console.error)
//
//playByPlay(getMostPopularUsername('kmamykin', 'mojombo'))
//  .expect(storage.getItem('users:kmamykin'), 10)
//  .expect(storage.getItem('users:mojombo'), null)
//  .expect(github.getUser('mojombo'), {followers: 1000})
//  .returns('mojombo')
//  .then(console.log, console.error)
//
//playByPlay(getMostPopularUsername2('kmamykin', 'mojombo'))
//  .expect(storage.getItem('users:kmamykin'), 10)
//  .expect(storage.getItem('users:mojombo'), null)
//  .expect(github.getUser('mojombo'), {followers: 1000})
//  .expect(storage.setItem('users:mojombo', 1000))
//  .returns('mojombo')
//  .then(console.log, console.error)
//
const state2 = new Map()
run(getMostPopularUsername2('kmamykin', 'hamin', 'mjording', 'Ocramius', 'brianchandotcom'), combineInterpreters(runOnMap(state2), runGithub({})))
  .then(console.log.bind(console, 'Most popular user'))
  .then(_ => console.log(state2))
