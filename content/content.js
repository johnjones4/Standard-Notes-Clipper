(() => {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'clip') {
      startClipper().then(content => {
        sendResponse({
          title: getTitle(),
          url: getURL(),
          text: content
        })
      })
      return true
    } else if (request.type === 'done') {
      alert('Saved!')
      return false
    } else {
      return false
    }
  })

  const getTitle = () => {
    const ogTitleElement = document.querySelector('[property="og:title"]')
    if (ogTitleElement) {
      return ogTitleElement.getAttribute('content')
    }
    const twitterTitleElement = document.querySelector('[name="twitter:title"]')
    if (twitterTitleElement) {
      return ogTitleElement.getAttribute('content')
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

  const startClipper = () => {
    return new Promise((resolve, reject) => {
      const hoverEl = makeHoverElement()

      const hoverChanged = (event) => {
        const el = document.elementFromPoint(event.clientX, event.clientY)
        if (el) {
          matchHoverElement(hoverEl, el)
        }
      }

      const hoverClicked = (event) => {
        hoverEl.remove()
        const el = document.elementFromPoint(event.clientX, event.clientY)
        const content = el.innerHTML
        resolve(content)
      }

      document.body.appendChild(hoverEl)
      document.addEventListener('mousemove', hoverChanged, false)
      document.addEventListener('mouseup', hoverClicked, false)
    })
  }

  const matchHoverElement = (hoverEl, el) => {
    const rect = el.getBoundingClientRect()
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    hoverEl.style.top = (rect.top + scrollTop) + 'px'
    hoverEl.style.left = (rect.left + scrollLeft) + 'px'
    hoverEl.style.width = rect.width + 'px'
    hoverEl.style.height = rect.height + 'px'
  }

  const makeHoverElement = () => {
    const hoverEl = document.createElement('div')
    hoverEl.id = 'standard-notes-clipper-hover'
    return hoverEl
  }
})()
