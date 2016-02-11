// Effect module consisting of interpreter and effect creators
require('isomorphic-fetch')

export const getUser = username => ({type: 'GET_USER', username})
export const getFollowers = url => ({type: 'GET_FOLLOWERS', url})

export default config => effect => {
  switch (effect.type) {
    case 'GET_USER':
      return fetch(`https://api.github.com/users/${effect.username}`).then(r => r.json())
    case 'GET_FOLLOWERS':
      return fetch(effect.url).then(r => r.json())
  }
}

