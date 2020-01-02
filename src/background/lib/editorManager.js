import {
  chromeGetPromise,
  chromeSetPromise
} from './util'
import _ from 'lodash'

export const getPreferredEditor = async () => {
  const { editors, preferredEditor } = await chromeGetPromise({
    editors: {},
    preferredEditor: null
  })
  if (preferredEditor && editors[preferredEditor]) {
    return editors[preferredEditor]
  }
  return null
}

export const getEditors = async () => {
  const { editors } = await chromeGetPromise({
    editors: {}
  })
  const arr = []
  _.keys(editors).forEach(uuid => {
    arr.push(editors[uuid])
  })
  return arr
}

export const setPreferredEditor = (editorUUID) => {
  return chromeSetPromise({
    preferredEditor: editorUUID
  })
}

export const getFormatForEditor = (editor) => {
  if (!editor) {
    return 'plaintext'
  }
  switch (editor.content.name) {
    case 'Advanced Markdown Editor':
    case 'Simple Markdown Editor':
    case 'Minimal Markdown Editor':
      return 'markdown'
    case 'Bold Editor':
    case 'Plus Editor':
      return 'html'
    case 'Simple Task Editor':
    case 'Code Editor':
    case 'Math Editor':
    case 'Vim Editor':
    case 'Secure Spreadsheets':
      return 'plaintext'
    default:
      return 'plaintext'
  }
}
