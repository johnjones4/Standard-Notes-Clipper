import {
  chromeGetPromise,
  chromeSetPromise
} from './lib/util'

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
  for (const uuid in editors) {
    arr.push(editors[uuid])
  }
  return arr
}

export const setPreferredEditor = (editorUUID) => {
  return chromeSetPromise({
    preferredEditor: editorUUID
  })
}
