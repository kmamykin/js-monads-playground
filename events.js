import daggy from 'daggy'

const UnitEvent = daggy.taggedSum({
  UnitRegistered: ['serialNumber'],
  UnitProvisioned: ['profile'],
  UnitDecommissioned: ['time']
})

console.log(UnitEvent.UnitRegistered('123'))
console.log(typeof UnitEvent.UnitRegistered('123'))
console.log(UnitEvent.UnitRegistered('123') instanceof UnitEvent)
console.log(UnitEvent.UnitRegistered('123') instanceof UnitEvent.UnitRegistered)
console.log(UnitEvent.UnitRegistered('123') instanceof UnitEvent.UnitProvisioned)

UnitEvent.UnitRegistered('123').cata({
  UnitRegistered: (sn) => console.log(sn),
  UnitProvisioned: (sn, p) => console.log(sn, p)
})

const history = [
  UnitEvent.UnitRegistered('123'),
  UnitEvent.UnitProvisioned({a: 1, b: 2}),
  UnitEvent.UnitDecommissioned(new Date())
]

const toEndofunction = event => event.cata({
  UnitRegistered: (serialNumber) => state => ({status: 'registered', serialNumber}),
  UnitProvisioned: (profile) => state => ({...state, status: 'provisioned', profile}),
  UnitDecommissioned: (time) => state => ({...state, status: 'decommissioned', time})
})

const compose = (fns) => fns.reduce((composed, fn) => s => fn(composed(s)), s => s)

console.log(compose(history.map(toEndofunction))({}))
