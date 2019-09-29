const SFJS = new StandardFile()

chrome.browserAction.onClicked.addListener(tab => {
  const tabid = tab.id
  checkForUser()
    .then(userInfo => {
      return sendMessagePromise(tabid, 'clip', null)
        .then(content => saveClipping(content, userInfo))
    })
    .then(() => sendMessagePromise(tabid, 'done'))
    .catch(err => {
      console.error(err)
      return sendMessagePromise(tabid, 'error', null)
    })
})

const sendMessagePromise = (tabid, type, payload) => {
  return new Promise((resolve, _) => {
    chrome.tabs.sendMessage(tabid, {type, payload}, (response) => {
      resolve(response)
    })
  })
}

const snRequest = (auth, path, method, body) => {
  return (() => {
    if (auth) {
      return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['token'], (items) => resolve(items.token))
      })
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
        throw new Error(res.errors.map(e => e.message).join(', '))
      } else if (res && res.error) {
        throw new Error(res.error.message)
      } else if (!res) {
        throw new Error('Bad data from server!')
      }
      return res
    })
}

const logout = window.logout = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({
      token: null,
      params: null,
      keys: null,
      tagSyncToken: null,
      tags: []
    }, () => {
      resolve()
    })
  })
}

const login = window.login = (email, password) => {
  let mk = null
  let ak = null
  let params = null
  return snRequest(false, 'auth/params?email=' + encodeURIComponent(email), 'GET', null)
    .then(_params => {
      params = _params
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
    .then(({token}) => {
      return new Promise((resolve, reject) => {
        chrome.storage.sync.set({
          token,
          params,
          keys: {
            mk,
            ak
          }
        }, () => {
          resolve()
        })
      })
    })
}

const saveClipping = (content, {params, keys}) => {
  const item = new SFItem({
    content,
    content_type: 'Note',
    created_at: new Date()
  })
  return SFJS.itemTransformer.encryptItem(item, keys, params)
    .then(({content, enc_item_key}) => {
      return snRequest(true, 'items/sync', 'POST', {
        items: [
          {
            uuid: item.uuid,
            content,
            enc_item_key,
            content_type: item.content_type,
            created_at: item.created_at
          }
        ],
        limit: 1
      })
    })
    .then(result => {
      console.log(result)
    })
}

const syncTags = () => {
  const fetchTags = (keys, syncToken, cursorToken, tags) => {
    return snRequest(true, 'items/sync', 'POST', {
      items: [],
      sync_token: syncToken,
      cursor_token: cursorToken
    })
      .then(response => {
        const newTags = []
        response.retrieved_items.forEach(item => {
          if (item.content_type === 'Tag') {
            if (item.deleted) {
              delete tags[item.uuid]
            } else {
              newTags.push(item)
            }
          }
        })
        return Promise.all(
          newTags.map(tag => {
            return SFJS.itemTransformer.decryptItem(tag, keys)
              .then(() => {
                const content = JSON.parse(tag.content)
                tags[tag.uuid] = content.title
              })
          })
        ).then(() => response)
      })
      .then(response => {
        if (response.cursor_token) {
          return fetchTags(keys, syncToken, response.cursor_token, tags)
        } else {
          return {
            tags,
            syncToken: response.sync_token
          }
        }
      })
  }
  return (() => {
    return new Promise((resolve) => {
      chrome.storage.sync.get({
        keys: null,
        tagSyncToken: null,
        tags: {}
      }, (items) => resolve(items))
    })
  })()
    .then(({tagSyncToken, tags, keys}) => {
      return fetchTags(keys, tagSyncToken, null, tags)
    })
    .then(({tags, syncToken}) => {
      return new Promise((resolve) => {
        chrome.storage.sync.set({
          tagSyncToken: syncToken,
          tags: tags
        },() => resolve(tags))
      })
    })
}
  
const checkForUser = () => {
  return new Promise((resolve) => {
    chrome.storage.sync.get({
      token: null,
      params: null,
      keys: null
    }, items => {
      if (items.token === null || items.params === null || items.keys === null) {
        return chrome.runtime.openOptionsPage()
      }
      resolve(items)
    })
  })
}

checkForUser()
  .then(items => {
    if (items.token) {
      syncTags() 
    }
  })
