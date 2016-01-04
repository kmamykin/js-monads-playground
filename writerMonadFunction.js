const Writer = (empty, append) => (value, accumulator = empty) => {
  const run = () => ({ value, accumulator })
  const bind = f => {
    const r = f(value).run()
    return Writer(empty, append)(r.value, append(accumulator, r.accumulator))
  }
  return { run, bind }
}

const NumberWithTrace = Writer([], (a, b) => a.concat(b))

const incBy = number => x => NumberWithTrace(x + number, [`incremented ${x} by ${number}`])
const multiplyBy = number => x => NumberWithTrace(x * number, [`multiplied ${x} by ${number}`])

console.log(NumberWithTrace(4).bind(multiplyBy(3)).bind(incBy(1)).run())

// Example with IO side-effect

const XXX = Writer(_ => _, (a, b) => () => b(a()))

const op1 = number => x => XXX(x + number, () => console.log(`incremented ${x} by ${number}`))
const op2 = number => x => XXX(x * number, () => console.log(`multiplied ${x} by ${number}`))
const res = XXX(4).bind(op1(10)).bind(op2(2)).run()
console.log(res.value)
res.accumulator()
