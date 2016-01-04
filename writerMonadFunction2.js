const Writer = (empty, append) => (value, accumulator = empty) => {
  const bind = f => {
    const r = f(value)
    return Writer(empty, append)(r.value, append(accumulator, r.accumulator))
  }
  return { value, accumulator, bind }
}

const NumberWithTrace = Writer([], (a, b) => a.concat(b))

const incBy = number => x => NumberWithTrace(x + number, [`incremented ${x} by ${number}`])
const multiplyBy = number => x => NumberWithTrace(x * number, [`multiplied ${x} by ${number}`])

console.log(NumberWithTrace(4).bind(multiplyBy(3)).bind(incBy(1)))

// Example with IO side-effect

const XXX = Writer(_ => _, (a, b) => () => b(a()))

const op1 = number => x => XXX(x + number, () => console.log(`incremented ${x} by ${number}`))
const op2 = number => x => XXX(x * number, () => console.log(`multiplied ${x} by ${number}`))
const res = XXX(4).bind(op1(10)).bind(op2(2))
console.log(res.value)
res.accumulator()

// Example with Promise IO, accumulator: Promise

const log = message => new Promise((resolve, _) => {
  console.log(message);
  resolve()
})

const Promised = Writer(Promise.resolve(), (a, b) => a.then(_ => b))

const res1 = Promised(1).bind(n => Promised(n + 2, log(`incremented ${n} by 2`)))
console.log(res1.value)
res1.accumulator.then(_=>console.log('done'))

// Example with Promise IO, accumulator: () => Promise

const Promised2 = Writer(() => Promise.resolve(), (a, b) => () => a().then(_ => b()))

const res2 = Promised2(1).bind(n => Promised2(n + 2, () => log(`incremented ${n} by 2`)))
console.log(res2.value)
res2.accumulator().then(_=>console.log('done'))
