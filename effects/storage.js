const getItem = key => ({type: 'GET_ITEM', key})
const setItem = (key, value) => ({type: 'SET_ITEM', key, value})
const removeItem = key => ({type: 'REMOVE_ITEM', key})
const clear = () => ({type: 'CLEAR'})

export default {
  getItem,
  setItem,
  removeItem,
  clear
}

export const run = ({storage}) => effect => {
  switch (effect.type) {
    case 'GET_ITEM':
      return Promise.resolve(storage.getItem(effect.key))
    case 'SET_ITEM':
      storage.setItem(effect.key, effect.value)
      return Promise.resolve()
    case 'REMOVE_ITEM':
      storage.removeItem(effect.key)
      return Promise.resolve()
    case 'CLEAR':
      storage.clear()
      return Promise.resolve()
  }
}

export const runOnMap = map => effect => {
  console.log('Interpreting effect', effect, 'on', map)
  switch (effect.type) {
    case 'GET_ITEM':
      const result = map.get(effect.key)
      console.log('Result', result)
      return Promise.resolve(result)
    case 'SET_ITEM':
      map.set(effect.key, effect.value)
      console.log('After effect', map)
      return Promise.resolve()
    case 'REMOVE_ITEM':
      map.delete(effect.key)
      console.log('After effect', map)
      return Promise.resolve()
    case 'CLEAR':
      map.clear()
      console.log('After effect', map)
      return Promise.resolve()
  }
}
