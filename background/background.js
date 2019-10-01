/* global StandardFile:readonly checkForUser:readonly sendMessagePromise:readonly saveClipping:readonly chromeSetPromise:readonly getParams:readonly snRequest:readonly syncInfo:readonly */

chrome.browserAction.onClicked.addListener(tab => {
  checkForUser()
    .then(() => sendMessagePromise(tab.id, 'clip', null))
    .then(content => saveClipping(content))
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
    tags: {},
    editors: {}
  })
}

window.login = (email, password, extraParams) => {
  let mk = null
  let ak = null
  let params = null
  const authParams = getParams(Object.assign({}, { email }, extraParams))
  return snRequest(false, 'auth/params?' + authParams, 'GET', null)
    .then(_params => {
      params = _params
      const SFJS = new StandardFile()
      return SFJS.crypto.computeEncryptionKeysForUser(password, params)
    })
    .then(keys => {
      mk = keys.mk
      ak = keys.ak
      const body = Object.assign({}, {
        email,
        password: keys.pw
      }, extraParams)
      return snRequest(false, 'auth/sign_in', 'POST', body)
    })
    .then(({ token }) => chromeSetPromise({
      token,
      params,
      keys: {
        mk,
        ak
      }
    }))
    .catch(error => {
      if (error.serverInfo.tag === 'mfa-required' || error.serverInfo.tag === 'mfa-invalid') {
        return error.serverInfo
      } else {
        throw error
      }
    })
}

checkForUser()
  .then(items => {
    if (items && items.token) {
      syncInfo()
    }
  })
