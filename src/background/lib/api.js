import { StandardFile, SFItem } from 'standard-file-js'
import {
  chromeGetPromise,
  snRequest
} from './util'
import {
  getPreferredEditor
} from './storage'

export const saveClipping = async (baseContent) => {
  const item = new SFItem({
    content: Object.assign({}, baseContent, {
      appData: {}
    }),
    content_type: 'Note',
    created_at: new Date()
  })

  const _editor = await getPreferredEditor()
  const editor = _editor ? new SFItem(_editor) : null
  if (editor) {
    editor.content.associatedItemIds.push(item.uuid)
    item.content.appData['org.standardnotes.sn.components'] = {}
    item.content.appData['org.standardnotes.sn.components'][editor.uuid] = {}
    item.content.appData['org.standardnotes.sn'] = {
      prefersPlainEditor: false
    }
  }

  const { params, keys } = await chromeGetPromise({
    params: {},
    keys: {}
  })

  const SFJS = new StandardFile()

  const items = await Promise.all([
    // eslint-disable-next-line camelcase
    SFJS.itemTransformer.encryptItem(item, keys, params).then(({ content, enc_item_key }) => {
      return {
        uuid: item.uuid,
        content,
        enc_item_key,
        content_type: item.content_type,
        created_at: item.created_at
      }
    }),
    // eslint-disable-next-line camelcase
    editor ? SFJS.itemTransformer.encryptItem(editor, keys, params).then(({ content, enc_item_key }) => {
      return Object.assign({}, editor, {
        content,
        enc_item_key
      })
    }) : Promise.resolve(null)
  ])

  await snRequest(true, 'items/sync', 'POST', {
    items: items.filter(item => item !== null),
    limit: 1
  })

  return item
}

export const updateItemTags = async (item, itemTags) => {
  const { params, keys, noteTags } = await chromeGetPromise({
    params: {},
    keys: {},
    noteTags: {}
  })

  const constTagNameMap = {}
  for (const uuid in noteTags) {
    const tag = noteTags[uuid]
    constTagNameMap[tag.content.title] = tag
  }
  const saveItems = [item]
  itemTags.forEach(tagName => {
    let tagItem = null
    if (constTagNameMap[tagName]) {
      tagItem = new SFItem(constTagNameMap[tagName])
    } else {
      tagItem = new SFItem({
        content: {
          title: tagName
        },
        content_type: 'Tag',
        created_at: new Date()
      })
    }
    item.addItemAsRelationship(tagItem)
    saveItems.push(tagItem)
  })

  const SFJS = new StandardFile()
  const items = await Promise.all(
    saveItems.map(item => {
      // eslint-disable-next-line camelcase
      return SFJS.itemTransformer.encryptItem(item, keys, params).then(({ content, enc_item_key }) => {
        return Object.assign({}, item, {
          content,
          enc_item_key
        })
      })
    })
  )

  await snRequest(true, 'items/sync', 'POST', {
    items,
    limit: 1
  })
}

export const fetchItems = async (keys, syncToken, cursorToken, tags, editors) => {
  const response = await snRequest(true, 'items/sync', 'POST', {
    items: [],
    sync_token: syncToken,
    cursor_token: cursorToken
  })

  const newTags = []
  const newPossibleEditors = []
  response.retrieved_items.forEach(item => {
    if (item.content_type === 'Tag') {
      if (item.deleted) {
        delete tags[item.uuid]
      } else {
        newTags.push(item)
      }
    } else if (item.content_type === 'SN|Component') {
      if (item.deleted) {
        delete editors[item.uuid]
      } else {
        newPossibleEditors.push(item)
      }
    }
  })

  const SFJS = new StandardFile()

  await Promise.all(
    newTags.map(tag => {
      return SFJS.itemTransformer.decryptItem(tag, keys)
        .then(() => {
          tag.content = JSON.parse(tag.content)
          tags[tag.uuid] = tag
        })
    })
  )

  await Promise.all(
    newPossibleEditors.map(possibleEditor => {
      return SFJS.itemTransformer.decryptItem(possibleEditor, keys)
        .then(() => {
          possibleEditor.content = JSON.parse(possibleEditor.content)
          if (possibleEditor.content.area === 'editor-editor') {
            editors[possibleEditor.uuid] = possibleEditor
          }
        })
    })
  )

  if (response.cursor_token) {
    return fetchItems(keys, syncToken, response.cursor_token, tags, editors)
  } else {
    return {
      tags,
      editors,
      syncToken: response.sync_token
    }
  }
}
