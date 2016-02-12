// Effect module consisting of interpreter and effect creators
require('isomorphic-fetch')

export default {
  getUser: username => ({type: 'GET_USER', username}),
  getFollowers: url => ({type: 'GET_FOLLOWERS', url})
}

export const run = config => effect => {
  switch (effect.type) {
    case 'GET_USER':
      return fetch(`https://api.github.com/users/${effect.username}`).then(r => r.json())
    case 'GET_FOLLOWERS':
      return fetch(effect.url).then(r => r.json())
  }
}

