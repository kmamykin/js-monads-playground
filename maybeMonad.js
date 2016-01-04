const Nothing = () => ({
  bind: _ => Nothing(),
  run: f => f(null)
})
const Just = value => ({
  bind: f => f(value),
  run: f => f(value)
})

const half = number => number % 2 === 0 ? Just(number / 2) : Nothing()

Just(32).bind(half).bind(half).bind(half).run(console.log)
Just(41).bind(half).bind(half).bind(half).run(console.log)

