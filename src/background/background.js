import regeneratorRuntime from 'regenerator-runtime'
import { StandardFile } from 'standard-file-js'
import {
  getPreferredEditor,
  getEditors,
  setPreferredEditor
} from './lib/editorManager'
import {
  checkForUser,
  sendMessagePromise,
  chromeGetPromise,
  chromeSetPromise,
  snRequest,
  getParams
} from './lib/util'
import {
  saveClipping,
  fetchItems,
  updateItemTags
} from './lib/api'
import 'lodash'
import {
  contextMenuId,
  addContextMenu,
  enableContextMenu,
  disableContextMenu,
  isContextMenuEnabled
} from './lib/contextMenuManager'

window.regeneratorRuntime = regeneratorRuntime
window.getPreferredEditor = getPreferredEditor
window.getEditors = getEditors
window.setPreferredEditor = setPreferredEditor
window.isContextMenuEnabled = isContextMenuEnabled
window.enableContextMenu = enableContextMenu
window.disableContextMenu = disableContextMenu

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === contextMenuId) {
    await doClip(tab, {
      text: info.selectionText,
      preview_plain: info.selectionText
    })
  }
})

chrome.browserAction.onClicked.addListener(async tab => {
  await doClip(tab, null)
})

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

const doClip = async (tab, _content) => {
  try {
    await checkForUser()
    await syncInfo()
    const content = await sendMessagePromise(tab.id, 'clip', { content: _content })
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

const setupContextMenu = async () => {
  const { contextMenu } = await chromeGetPromise({
    contextMenu: true
  })
  if (contextMenu) {
    addContextMenu()
  }
}

const initializeAddon = async () => {
  const items = await checkForUser()
  if (items && items.token) {
    syncInfo()
  }
  await setupContextMenu()
}

initializeAddon()
