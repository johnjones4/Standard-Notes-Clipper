/* global StandardFile:readonly SFItem:readonly chromeGetPromise:readonly chromeSetPromise:readonly snRequest:readonly getPreferredEditor:readonly */

// eslint-disable-next-line no-unused-vars
const saveClipping = (baseContent) => {
  let item = null
  const SFJS = new StandardFile()
  return getPreferredEditor()
    .then(_editor => {
      item = new SFItem({
        content: Object.assign({}, baseContent, {
          appData: {},
          preview_plain: baseContent.text,
          preview_html: baseContent.text
        }),
        content_type: 'Note',
        created_at: new Date()
      })
      const editor = _editor ? new SFItem(_editor) : null
      if (editor) {
        editor.content.associatedItemIds.push(item.uuid)
        item.content.appData['org.standardnotes.sn.components'] = {}
        item.content.appData['org.standardnotes.sn.components'][editor.uuid] = {}
        item.content.appData['org.standardnotes.sn'] = {
          prefersPlainEditor: false
        }
      }
      return chromeGetPromise({
        params: {},
        keys: {}
      })
        .then(({ params, keys }) => {
          return Promise.all([
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
        })
        .then(items => snRequest(true, 'items/sync', 'POST', {
          items: items.filter(item => item !== null),
          limit: 1
        }))
    })
    .then(() => {
      return item
    })
}

const updateItemTags = (item, itemTags) => {
  return chromeGetPromise({
    params: {},
    keys: {},
    noteTags: {}
  })
    .then(({ params, keys, noteTags }) => {
      constTagNameMap = {}
      for (let uuid in noteTags) {
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

      return Promise.all(
        saveItems.map(item => {
          return SFJS.itemTransformer.encryptItem(item, keys, params).then(({ content, enc_item_key }) => {
            return Object.assign({}, item, {
              content,
              enc_item_key
            })
          })
        })
      )
    })
    .then(items => snRequest(true, 'items/sync', 'POST', {
      items,
      limit: 1
    }))
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
    noteTags: {},
    editors: {}
  })
    .then(({ tagSyncToken, noteTags, keys, editors }) => {
      return fetchItems(keys, tagSyncToken, null, noteTags, editors)
    })
    .then(({ tags, editors, syncToken }) => {
      return chromeSetPromise({
        tagSyncToken: syncToken,
        noteTags: tags,
        editors: editors
      }).then(() => tags)
    })
}
