/* global StandardFile:readonly */

chrome.browserAction.onClicked.addListener(tab => {
  checkForUser()
    .then(userInfo => {
      return sendMessagePromise(tab.id, 'clip', null)
        .then(content => saveClipping(content, userInfo))
    })
    .then(() => sendMessagePromise(tab.id, 'done'))
    .catch(err => {
      console.error(err)
      return sendMessagePromise(tab.id, 'error', { error: err.message })
    })
})

window.logout = () => {
  return chromeSetPromise({
    token: null,
    params: null,
    keys: null,
    tagSyncToken: null,
    tags: []
  })
}

window.login = (email, password) => {
  let mk = null
  let ak = null
  let params = null
  return snRequest(false, 'auth/params?email=' + encodeURIComponent(email), 'GET', null)
    .then(_params => {
      params = _params
      const SFJS = new StandardFile()
      return SFJS.crypto.computeEncryptionKeysForUser(password, params)
    })
    .then(keys => {
      mk = keys.mk
      ak = keys.ak
      return snRequest(false, 'auth/sign_in', 'POST', {
        email,
        password: keys.pw
      })
    })
    .then(({ token }) => chromeSetPromise({
      token,
      params,
      keys: {
        mk,
        ak
      }
    }))
}

checkForUser()
  .then(items => {
    if (items.token) {
      syncTags()
    }
  })
