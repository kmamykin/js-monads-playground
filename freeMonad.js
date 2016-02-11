import {Free} from 'monet'

// Reimplementing KVS example in JavaScript: https://github.com/kenbot/free/blob/master/src/main/scala/kenbot/free/KVS.scala

// 0. Fantasy API
// def put(key: String, value: String): Unit
// def get(key: String): String
// def delete(key: String): Unit

import daggy from 'daggy'

const KVS = daggy.taggedSum({
  Put: ['key', 'value', 'next'],
  Get: ['key', 'onResult'],
  Delete: ['key', 'next']
})

KVS.prototype.map = function (f) {
  return this.cata({
    Put: (key, value, next) => KVS.Put(key, value, f(next)),
    Get: (key, onResult) => KVS.Get(key, (x) => f(onResult(x))),
    Delete: (key, next) => KVS.Delete(key, f(next))
  })
}

const identity = (x) => x

const put = (key, value) => Free.liftF(KVS.Put(key, value, null))
const get = (key) => Free.liftF(KVS.Get(key, identity))
const del = (key) => Free.liftF(KVS.Delete(key, null))
const modify = (key, fn) => {
  return get(key).chain(v => put(key, fn(v)))
}

// Abstract script, all side-effects expressed in terms on DSL operations
// The expressiveness kinda sucks because of chaining. Can we express this as a generator function?
function * scriptGen() {
  const acc = yield get('swiss-bank-account-id')
  yield modify(acc, balance => balance + 1000000 )
  yield put("bermuda-airport", "getaway car")
  yield del('tax-records')
}

const script = () => {
  return get('swiss-bank-account-id')
    .chain(acc => modify(acc, balance => balance + 1000000)
      .chain(_ => put("bermuda-airport", "getaway car")
        .chain(_ => del('tax-records'))))

}

const interpretPure = (kvs, table={}) => {
  return kvs.resume().cata(x => x.cata({
    Get: (key, onResult) => interpretPure(onResult(table[key]), table),
    Put: (key, value, next) => interpretPure(next, {...table, [key]: value}),
    Delete: (key, next) => interpretPure(next, {...table, [key]: null})
  }), x => table)
}
const initial = {'swiss-bank-account-id': '123123123', '123123123': 999999, 'tax-records': 'yes'}
console.log(initial)
console.log(interpretPure(script(), initial))

const interpretImpure = (kvs, table) => {
  return kvs.go(x => x.cata({
    Get: (key, onResult) => {
      console.log(`Get(${key}) => ${table[key]}`)
      return onResult(table[key])
    },
    Put: (key, value, next) => {
      console.log(`Put(${key}, ${value})`)
      return next
    },
    Delete: (key, next) => {
      console.log(`Delete(${key})`)
      return next
    }
  }))
}

interpretImpure(script(), initial)
