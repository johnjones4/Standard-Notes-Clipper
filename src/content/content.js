import regeneratorRuntime from 'regenerator-runtime'
import Clipper from './lib/Clipper'

window.regeneratorRuntime = regeneratorRuntime
let clipper = null

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    switch (request.type) {
      case 'clip':
        startClipper(request.payload.content ? request.payload.content : null)
          .then(content => sendResponse(content))
        return true
      case 'saved':
        finishClipper()
          .then(content => sendResponse(content))
        return true
      case 'done':
        removeClipper()
        return true
      case 'error':
        alert(request.payload.error)
        clipper = null
        return false
      default:
        return false
    }
  } catch (err) {
    alert(err.message)
    clipper = null
  }
})

const getTitle = () => {
  const ogTitleElement = document.querySelector('[property="og:title"]')
  if (ogTitleElement) {
    return ogTitleElement.getAttribute('content')
  }
  const twitterTitleElement = document.querySelector('[name="twitter:title"]')
  if (twitterTitleElement) {
    return twitterTitleElement.getAttribute('content')
  }
  return document.title
}

const getURL = () => {
  const canonicalElement = document.querySelector('link[rel="canonical"]')
  if (canonicalElement) {
    return canonicalElement.getAttribute('href')
  }
  return window.location.href
}

const getText = () => {
  const selection = window.getSelection()
  if (selection && selection.rangeCount > 0) {
    return selection.toString()
  }
  return ''
}

const startClipper = async (contentBase) => {
  if (clipper) {
    clipper.detach()
  }
  const content = Object.assign({}, {
    title: getTitle(),
    url: getURL(),
    text: getText(),
    preview_plain: getText(),
    tags: []
  }, contentBase)
  clipper = new Clipper(content)
  clipper.on('cancel', (content) => {
    removeClipper(true)
  })
  const p = new Promise((resolve, reject) => {
    clipper.on('clipped', content => {
      resolve(content)
    })
  })
  await clipper.attach()
  return p
}

const finishClipper = async () => {
  if (clipper) {
    clipper.setStep(1)
    return new Promise((resolve, reject) => {
      clipper.on('finalized', (content) => {
        resolve(content)
      })
    })
  }
  return Promise.reject(new Error('No active clipper'))
}

const removeClipper = (immediate = false) => {
  if (clipper) {
    clipper.setStep(2)
    const lastStep = () => {
      clipper.detach()
      clipper = null
    }
    if (immediate) {
      lastStep()
    } else {
      setTimeout(() => lastStep(), 1000)
    }
  }
}
