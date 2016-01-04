const Writer = (value, log = []) => {
  const run = () => ({ value, log })
  const bind = f => {
    const r = f(value).run()
    return Writer(r.value, [...log, ...r.log])
  }
  return { run, bind }
}

const incBy = number => x => Writer(x + number, [`incremented ${x} by ${number}`])
const multiplyBy = number => x => Writer(x * number, [`multiplied ${x} by ${number}`])

console.log(Writer(4).bind(multiplyBy(3)).bind(incBy(1)).run())

