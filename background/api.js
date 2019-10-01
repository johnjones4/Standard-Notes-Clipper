/* global StandardFile:readonly SFItem:readonly chromeGetPromise:readonly chromeSetPromise:readonly snRequest:readonly */

// eslint-disable-next-line no-unused-vars
const saveClipping = (baseContent) => {
  const SFJS = new StandardFile()
  return getPreferredEditor()
    .then(editor => {
      const item = new SFItem({
        content: Object.assign({}, baseContent, {
          appData: generateAppData(editor),
          preview_plain: baseContent.text,
          preview_html: baseContent.text
        }),
        content_type: 'Note',
        created_at: new Date()
      })
      if (editor) {
        editor.content.associatedItemIds.push(item.uuid)
      }
      return chromeGetPromise({
        params: {},
        keys: {}
      })
        .then(({ params, keys }) => {
          return Promise.all([
            SFJS.itemTransformer.encryptItem(item, keys, params),
            editor ? SFJS.itemTransformer.encryptItem(new SFItem(editor), keys, params) : Promise.resolve(null)
          ])
        })
        .then(info => {
          const items = [
            {
              uuid: item.uuid,
              content: info[0].content,
              enc_item_key: info[0].enc_item_key,
              content_type: item.content_type,
              created_at: item.created_at
            }
          ]
          if (info[1] !== null) {
            Object.assign({}, editor, {
              content: info[1].content,
              enc_item_key: info[1].enc_item_key
            })
          }
          return snRequest(true, 'items/sync', 'POST', {
            items,
            limit: 1
          })
        })
    })
}

const getPreferredEditor = () => {
  return chromeGetPromise({
    editors: {}
  })
    .then(({ editors }) => {
      for (let uuid in editors) {
        if (editors[uuid].content.name === 'Plus Editor') {
          return Object.assign({}, editors[uuid])
        }
      }
    })
}

const generateAppData = (editor) => {
  const appData = {}
  if (editor) {
    appData['org.standardnotes.sn.components'] = {}
    appData['org.standardnotes.sn.components'][editor.uuid] = {}
    appData['org.standardnotes.sn'] = {
      prefersPlainEditor: false
    }
  }
  return appData
}

const fetchItems = (keys, syncToken, cursorToken, tags, editors) => {
  return snRequest(true, 'items/sync', 'POST', {
    items: [],
    sync_token: syncToken,
    cursor_token: cursorToken
  })
    .then(response => {
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
      return Promise.all([
        Promise.all(
          newTags.map(tag => {
            return SFJS.itemTransformer.decryptItem(tag, keys)
              .then(() => {
                tag.content = JSON.parse(tag.content)
                tags[tag.uuid] = tag
              })
          })
        ),
        Promise.all(
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
      ]).then(() => response)
    })
    .then(response => {
      if (response.cursor_token) {
        return fetchItems(keys, syncToken, response.cursor_token, tags, editors)
      } else {
        return {
          tags,
          editors,
          syncToken: response.sync_token
        }
      }
    })
}

// eslint-disable-next-line no-unused-vars
const syncInfo = () => {
  return chromeGetPromise({
    keys: null,
    tagSyncToken: null,
    tags: {},
    editors: {}
  })
    .then(({ tagSyncToken, tags, keys, editors }) => {
      return fetchItems(keys, tagSyncToken, null, tags, editors)
    })
    .then(({ tags, editors, syncToken }) => {
      return chromeSetPromise({
        tagSyncToken: syncToken,
        tags: tags,
        editors: editors
      }).then(() => tags)
    })
}
