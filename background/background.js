/* global StandardFile:readonly checkForUser:readonly sendMessagePromise:readonly saveClipping:readonly chromeSetPromise:readonly getParams:readonly snRequest:readonly fetchItems:readonly chromeGetPromise:readonly updateItemTags:readonly */

chrome.browserAction.onClicked.addListener(async tab => {
  try {
    await checkForUser()
    await syncInfo()
    const content = await sendMessagePromise(tab.id, 'clip', null)
    const item = await saveClipping(content)
    const updatedContent = await sendMessagePromise(tab.id, 'saved', null)
    if (updatedContent) {
      item.content.title = updatedContent.title
      item.content.text = updatedContent.text
      await updateItemTags(item, updatedContent.tags)
    }
    await sendMessagePromise(tab.id, 'done')
  } catch (err) {
    console.error(err)
    await sendMessagePromise(tab.id, 'error', { error: err.message })
  }
})

// eslint-disable-next-line no-unused-vars
const getPreferredEditor = window.getPreferredEditor = async () => {
  const { editors, preferredEditor } = await chromeGetPromise({
    editors: {},
    preferredEditor: null
  })
  if (preferredEditor && editors[preferredEditor]) {
    return editors[preferredEditor]
  }
  return null
}

// eslint-disable-next-line no-unused-vars
const getEditors = window.getEditors = async () => {
  const { editors } = await chromeGetPromise({
    editors: {}
  })
  const arr = []
  for (const uuid in editors) {
    arr.push(editors[uuid])
  }
  return arr
}

// eslint-disable-next-line no-unused-vars
const setPreferredEditor = window.setPreferredEditor = (editorUUID) => {
  return chromeSetPromise({
    preferredEditor: editorUUID
  })
}

window.logout = () => {
  return chromeSetPromise({
    token: null,
    params: null,
    keys: null,
    tagSyncToken: null,
    tags: {},
    editors: {},
    preferredEditor: null
  })
}

window.login = async (email, password, extraParams) => {
  try {
    const authParams = getParams(Object.assign({}, { email }, extraParams))
    const params = await snRequest(false, 'auth/params?' + authParams, 'GET', null)
    const SFJS = new StandardFile()
    const { ak, mk, pw } = await SFJS.crypto.computeEncryptionKeysForUser(password, params)
    const body = Object.assign({}, {
      email,
      password: pw
    }, extraParams)
    const { token } = await snRequest(false, 'auth/sign_in', 'POST', body)
    await chromeSetPromise({
      token,
      params,
      keys: {
        mk,
        ak
      }
    })
  } catch (error) {
    if (error.serverInfo && (error.serverInfo.tag === 'mfa-required' || error.serverInfo.tag === 'mfa-invalid')) {
      return error.serverInfo
    } else {
      throw error
    }
  }
}

// eslint-disable-next-line no-unused-vars
const syncInfo = window.syncInfo = async () => {
  const { tagSyncToken, noteTags, keys, editors } = await chromeGetPromise({
    keys: null,
    tagSyncToken: null,
    noteTags: {},
    editors: {}
  })

  const { tags, editors: _editors, syncToken } = await fetchItems(keys, tagSyncToken, null, noteTags, editors)

  await chromeSetPromise({
    tagSyncToken: syncToken,
    noteTags: tags,
    editors: _editors
  })
}

const initializeAddon = async () => {
  const items = await checkForUser()
  if (items && items.token) {
    syncInfo()
  }
}

initializeAddon()
