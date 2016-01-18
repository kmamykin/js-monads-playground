const SuccessEvent = () => ({type: 'SuccessEvent'})
const FailureEvent = () => ({type: 'FailureEvent'})

const operationOnEntity3 = entity1 => entity2 => entity3 => {
  if (entity1.state.isGood && entity2.state.isGreat) {
    return entity3.append(SuccessEvent())
  } else {
    return entity3.append(FailureEvent())
  }
}

const Command = fnP => {
  const ap = argP => Command(fnP.then(f => argP.then(arg => f(arg))))
  const then = (f, e) => fnP.then(f, e)
  return {ap, then}
}

const op = Promise.resolve(operationOnEntity3)
const e1 = Promise.resolve({state:{isGood: true}})
const e2 = Promise.resolve({state:{isGreat: true}})
const e3 = Promise.resolve({
  append: e => Promise.resolve(e)
})

//op.then(opFn => e1.then(e => opFn(e)))
//  .then(opFn => e2.then(e => opFn(e)))
//  .then(opFn => e3.then(e => opFn(e)))
//  .then(console.log, console.error)

Command(op)
  .ap(e1)
  .ap(e2)
  .ap(e3)
  .then(console.log, console.error)
