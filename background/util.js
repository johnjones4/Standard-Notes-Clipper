
const sendMessagePromise = (tabid, type, payload) => {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabid, { type, payload }, (response) => {
      resolve(response)
    })
  })
}

const chromeSetPromise = (setParams) => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(setParams, () => {
      resolve()
    })
  })
}

const chromeGetPromise = (getParams) => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(getParams, items => {
      resolve(items)
    })
  })
}

class SNError extends Error {
  constructor (message, serverInfo) {
    super(message, null, null)
    this.serverInfo = serverInfo
  }
}

const getParams = (params) => {
  const paramArray = []
  for(let param in params) {
    paramArray.push(param + '=' + encodeURIComponent(params[param]))
  }
  return paramArray.join('&')
}

const snRequest = (auth, path, method, body) => {
  return (() => {
    if (auth) {
      return chromeGetPromise(['token']).then(items => items.token)
    } else {
      return Promise.resolve(null)
    }
  })()
    .then(token => {
      const params = {
        headers: {},
        method
      }
      if (token) {
        params.headers['Authorization'] = 'Bearer ' + token
      }
      if (body) {
        params.headers['Content-type'] = 'application/json'
        params.body = JSON.stringify(body)
      }
      return fetch('https://sync.standardnotes.org/' + path, params)
    })
    .then(response => response.json())
    .then(res => {
      if (res && res.errors) {
        throw new SNError(res.errors.map(e => e.message).join(', '), res.errors)
      } else if (res && res.error) {
        throw new SNError(res.error.message, res.error)
      } else if (!res) {
        throw new Error('Bad data from server!')
      }
      return res
    })
}

const checkForUser = () => {
  return chromeGetPromise({
    token: null,
    params: null,
    keys: null
  })
    .then(items => {
      if (items.token === null || items.params === null || items.keys === null) {
        return chrome.runtime.openOptionsPage()
      }
      return items
    })
}
