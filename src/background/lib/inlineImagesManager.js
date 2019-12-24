import {
  chromeSetPromise
} from './util'

let inlineImages = null

export const isInlineImagesEnabled = () => {
  return inlineImages === true
}

export const enableInlineImages = async () => {
  await chromeSetPromise({
    inlineImages: true
  })
  inlineImages = true
}

export const disableInlineImages = async () => {
  await chromeSetPromise({
    inlineImages: false
  })
  inlineImages = false
}
