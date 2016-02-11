require('isomorphic-fetch')

async function followers(username) {
  const userResponse = await fetch(`https://api.github.com/users/${username}`).then(r => r.json())
  const followers = await fetch(userResponse.followers_url).then(r => r.json())
  return followers.map(f => f.url)
}

followers('defunkt').then(console.log, console.error)
