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
  updateClipping
} from './lib/api'
import {
  contextMenuId,
  addContextMenu,
  enableContextMenu,
  disableContextMenu,
  isContextMenuEnabled
} from './lib/contextMenuManager'
import {
  enableInlineImages,
  disableInlineImages,
  isInlineImagesEnabled
} from './lib/inlineImagesManager'
import _ from 'lodash'
import sanitizeHtml from 'sanitize-html'

window.regeneratorRuntime = regeneratorRuntime
window.getPreferredEditor = getPreferredEditor
window.getEditors = getEditors
window.setPreferredEditor = setPreferredEditor
window.isContextMenuEnabled = isContextMenuEnabled
window.enableContextMenu = enableContextMenu
window.disableContextMenu = disableContextMenu
window.isInlineImagesEnabled = isInlineImagesEnabled
window.enableInlineImages = enableInlineImages
window.disableInlineImages = disableInlineImages

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === contextMenuId) {
    await doClip(tab, {
      text: info.selectionText + '\n\n' + info.pageUrl,
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
    preferredEditor: null,
    serverURL: null
  })
}

window.login = async (serverURL, email, password, extraParams) => {
  try {
    await chromeSetPromise({ serverURL })
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
    const tags = await getTagStrings()
    const editors = await getEditors()
    const editor = await getPreferredEditor()
    const content = await sendMessagePromise(tab.id, 'clip', {
      content: _content,
      tags,
      editors,
      editor: editor ? editor.uuid : null
    })
    content.text = sanitizeHtml(content.text, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img'])
    })
    const item = await saveClipping(content)
    const updatedContent = await sendMessagePromise(tab.id, 'saved', null)
    if (updatedContent) {
      item.content.title = updatedContent.title
      await updateClipping(item, updatedContent.tags, updatedContent.editor)
    }
    await sendMessagePromise(tab.id, 'done')
  } catch (err) {
    console.error(err)
    await sendMessagePromise(tab.id, 'error', { error: err.message })
  }
}

const getTagStrings = async () => {
  const { noteTags } = await chromeGetPromise({
    noteTags: {}
  })
  return _.values(noteTags).map(tag => tag.content.title)
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

const setupInlineImages = async () => {
  const { inlineImages } = await chromeGetPromise({
    inlineImages: true
  })
  if (inlineImages) {
    enableInlineImages()
  }
}

const initializeAddon = async () => {
  const items = await checkForUser()
  if (items && items.token) {
    syncInfo()
  }
  await setupContextMenu()
  await setupInlineImages()
}

initializeAddon()
