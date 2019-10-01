/* global StandardFile:readonly SFItem:readonly */

const saveClipping = (baseContent) => {
  const SFJS = new StandardFile()
  return chromeGetPromise({
    editors: {},
    params: {},
    keys: {}
  })
    .then(({ editors, params, keys }) => {
      const item = new SFItem({
        content: Object.assign({}, baseContent, {
          appData: generateAppData(editors),
          preview_plain: baseContent.text,
          preview_html: baseContent.text
        }),
        content_type: 'Note',
        created_at: new Date()
      })
      console.log(item)
      return SFJS.itemTransformer.encryptItem(item, keys, params)
        // eslint-disable-next-line camelcase
        .then(({ content, enc_item_key }) => {
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
    })
    .then(result => {
      console.log(result)
    })
}

const generateAppData = (editors) => {
  const appData = {}
  for (let uuid in editors) {
    if (editors[uuid] === 'Plus Editor') {
      appData['org.standardnotes.sn.components'] = {}
      appData['org.standardnotes.sn.components'][uuid] = {}
      appData['org.standardnotes.sn'] = {
        prefersPlainEditor: false
      }
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
                const content = JSON.parse(tag.content)
                tags[tag.uuid] = content.title
              })
          })
        ),
        Promise.all(
          newPossibleEditors.map(possibleEditor => {
            return SFJS.itemTransformer.decryptItem(possibleEditor, keys)
              .then(() => {
                const content = JSON.parse(possibleEditor.content)
                if (content.area === 'editor-editor') {
                  editors[possibleEditor.uuid] = content.name
                }
              })
          })
        )
      ])
      .then(() => response)
    })
    .then(response => {
      if (response.cursor_token) {
        return fetchTags(keys, syncToken, response.cursor_token, tags, editors)
      } else {
        return {
          tags,
          editors,
          syncToken: response.sync_token
        }
      }
    })
}

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
