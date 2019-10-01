/* global StandardFile:readonly SFItem:readonly */

const saveClipping = (content, { params, keys }) => {
  const item = new SFItem({
    content,
    content_type: 'Note',
    created_at: new Date()
  })
  const SFJS = new StandardFile()
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
    .then(result => {
      console.log(result)
    })
}

const fetchTags = (keys, syncToken, cursorToken, tags) => {
  return snRequest(true, 'items/sync', 'POST', {
    items: [],
    sync_token: syncToken,
    cursor_token: cursorToken
  })
    .then(response => {
      const newTags = []
      response.retrieved_items.forEach(item => {
        if (item.content_type === 'Tag') {
          if (item.deleted) {
            delete tags[item.uuid]
          } else {
            newTags.push(item)
          }
        }
      })
      return Promise.all(
        newTags.map(tag => {
          const SFJS = new StandardFile()
          return SFJS.itemTransformer.decryptItem(tag, keys)
            .then(() => {
              const content = JSON.parse(tag.content)
              tags[tag.uuid] = content.title
            })
        })
      ).then(() => response)
    })
    .then(response => {
      if (response.cursor_token) {
        return fetchTags(keys, syncToken, response.cursor_token, tags)
      } else {
        return {
          tags,
          syncToken: response.sync_token
        }
      }
    })
}

const syncTags = () => {
  return chromeGetPromise({
    keys: null,
    tagSyncToken: null,
    tags: {}
  })
    .then(({ tagSyncToken, tags, keys }) => {
      return fetchTags(keys, tagSyncToken, null, tags)
    })
    .then(({ tags, syncToken }) => {
      return chromeSetPromise({
        tagSyncToken: syncToken,
        tags: tags
      }).then(() => tags)
    })
}
