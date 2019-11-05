// eslint-disable-next-line no-unused-vars
const sendMessagePromise = (tabid, type, payload) => {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabid, { type, payload }, (response) => {
      resolve(response)
    })
  })
}

// eslint-disable-next-line no-unused-vars
const chromeSetPromise = (setParams) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(setParams, () => {
      resolve()
    })
  })
}

const chromeGetPromise = (getParams) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(getParams, items => {
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

// eslint-disable-next-line no-unused-vars
const getParams = (params) => {
  const paramArray = []
  for (const param in params) {
    paramArray.push(param + '=' + encodeURIComponent(params[param]))
  }
  return paramArray.join('&')
}

// eslint-disable-next-line no-unused-vars
const snRequest = async (auth, path, method, body) => {
  const token = auth ? (await chromeGetPromise(['token'])).token : null
  const params = {
    headers: {},
    method
  }
  if (token) {
    params.headers.Authorization = 'Bearer ' + token
  }
  if (body) {
    params.headers['Content-type'] = 'application/json'
    params.body = JSON.stringify(body)
  }
  const response = await fetch('https://sync.standardnotes.org/' + path, params)
  const res = await response.json()
  if (res && res.errors) {
    throw new SNError(res.errors.map(e => e.message).join(', '), res.errors)
  } else if (res && res.error) {
    throw new SNError(res.error.message, res.error)
  } else if (!res) {
    throw new Error('Bad data from server!')
  }
  return res
}

// eslint-disable-next-line no-unused-vars
const checkForUser = async () => {
  const items = await chromeGetPromise({
    token: null,
    params: null,
    keys: null
  })
  if (items.token === null || items.params === null || items.keys === null) {
    return chrome.runtime.openOptionsPage()
  }
  return items
}
