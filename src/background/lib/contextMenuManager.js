import {
  chromeSetPromise
} from './util'

let contextMenu = null

export const contextMenuId = 'standard-notes-clip'

export const isContextMenuEnabled = () => {
  return contextMenu !== null
}

export const enableContextMenu = async () => {
  await chromeSetPromise({
    contextMenu: true
  })
  addContextMenu()
}

export const disableContextMenu = async () => {
  await chromeSetPromise({
    contextMenu: false
  })
  removeContextMenu()
}

export const addContextMenu = () => {
  if (contextMenu) {
    removeContextMenu()
  }
  contextMenu = chrome.contextMenus.create({
    id: contextMenuId,
    title: 'Clip Selection',
    contexts: ['selection']
  })
}

export const removeContextMenu = () => {
  if (contextMenu) {
    chrome.contextMenus.remove(contextMenu)
    contextMenu = null
  }
}
