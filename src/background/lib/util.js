import SNError from './SNError'
import _ from 'lodash'

export const sendMessagePromise = (tabid, type, payload) => {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabid, { type, payload }, (response) => {
      resolve(response)
    })
  })
}

export const chromeSetPromise = (setParams) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(setParams, () => {
      resolve()
    })
  })
}

export const chromeGetPromise = (getParams) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(getParams, items => {
      resolve(items)
    })
  })
}

export const getParams = (params) => {
  const paramArray = []
  _.keys(params).forEach(param => {
    paramArray.push(param + '=' + encodeURIComponent(params[param]))
  })
  return paramArray.join('&')
}

export const snRequest = async (auth, path, method, body) => {
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

export const checkForUser = async () => {
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
