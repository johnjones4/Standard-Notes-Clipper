(() => {
  let clipper = null

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.type) {
      case 'clip':
        try {
          startClipper()
            .then(content => sendResponse(content))
            .catch(err => console.error(err))
        } catch (err) {
          alert(err.message)
        }
        return true
      case 'saved':
        finishClipper()
          .then(content => sendResponse(content))
          .catch(err => console.error(err))
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

  const startClipper = async () => {
    if (clipper) {
      clipper.detach()
    }
    const content = {
      title: getTitle(),
      url: getURL(),
      text: '',
      tags: []
    }
    clipper = new Clipper(content)
    await clipper.attach()
    return new Promise((resolve, reject) => {
      clipper.on('clipped', (content) => {
        resolve(content)
      })
    })
  }

  const finishClipper = () => {
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

  const removeClipper = () => {
    if (clipper) {
      clipper.setStep(2)
      setTimeout(() => {
        clipper.detach()
        clipper = null
      }, 1000)
    }
  }

  class ClipperBase {
    constructor () {
      this.handlers = {}
    }

    on (event, handler) {
      if (!this.handlers[event]) {
        this.handlers[event] = []
      }
      this.handlers[event].push(handler)
    }

    fire (event, info) {
      if (this.handlers[event]) {
        this.handlers[event].forEach(handler => {
          try {
            handler(info)
          } catch (e) {
            console.error(e)
          }
        })
      }
    }
  }

  class Clipper extends ClipperBase {
    constructor (content) {
      super()
      this.content = content
      this.step = 0
    }

    async attach () {
      this.shadowDomRoot = document.createElement('div')
      this.shadowDomRoot.style.zIndex = 100000
      document.body.appendChild(this.shadowDomRoot)
      this.shadowDomRoot.attachShadow({ mode: 'open' })
      const res = await fetch(chrome.runtime.getURL('content/content.css'))
      const stylesheet = await res.text()
      const style = document.createElement('style')
      style.textContent = stylesheet
      this.shadowDomRoot.shadowRoot.appendChild(style)
      this.updateState()
    }

    detach () {
      if (this.shadowDomRoot) {
        this.shadowDomRoot.remove()
      }
    }

    setStep (step) {
      this.step = step
      this.updateState()
    }

    updateState () {
      switch (this.step) {
        case 0:
          if (this.modeController) {
            this.modeController.getElement().remove()
          }
          this.modeController = new ClipModeController()
          this.mode = this.modeController.mode
          this.modeController.on('modechange', mode => {
            this.mode = mode
            this.updateMode()
          })
          this.shadowDomRoot.shadowRoot.appendChild(this.modeController.getElement())
          setTimeout(() => this.modeController.activate(), 100)
          this.updateMode()
          break
        case 1:
          if (this.modeController) {
            this.modeController.deactivate()
            setTimeout(() => this.modeController.getElement().remove(), 1000)
          }
          if (this.selector) {
            this.selector.stop()
          }
          this.metaController = new ClipMetaController(this.content)
          this.metaController.on('done', content => {
            this.content = content
            this.fire('finalized', this.content)
          })
          this.shadowDomRoot.shadowRoot.appendChild(this.metaController.getElement())
          setTimeout(() => this.metaController.activate(), 100)
          break
        case 2:
          if (this.metaController) {
            this.metaController.deactivate()
            setTimeout(() => this.metaController.getElement().remove(), 1000)
          }
          break
      }
    }

    updateMode () {
      if (this.selector) {
        this.selector.stop()
      }
      switch (this.mode) {
        case 'clip':
          this.selector = new DomClipperSelector(this.shadowDomRoot)
          break
        case 'highlight':
          this.selector = new HighlightClipperSelector(this.shadowDomRoot)
          break
      }
      this.selector.on('clipped', text => {
        this.content.text = text
        this.fire('clipped', this.content)
      })
      this.selector.start()
    }
  }

  class ClipperControlBoxController extends ClipperBase {
    getElement () {
      return this.controlBox
    }

    activate () {
      this.controlBox.classList.add('active')
    }

    deactivate () {
      this.controlBox.classList.remove('active')
    }
  }

  class ClipModeController extends ClipperControlBoxController {
    constructor () {
      super()
      this.handlers = {}
      this.mode = 'clip'
      this.initElement()
      this.updateForMode()
    }

    initElement () {
      this.controlBox = document.createElement('div')
      this.controlBox.className = 'standard-notes-control-box'

      const modeSelector = document.createElement('div')
      modeSelector.className = 'section mode-selector'
      this.controlBox.appendChild(modeSelector)

      this.clipModeButton = document.createElement('button')
      this.clipModeButton.className = 'mode-button'
      this.clipModeButton.textContent = 'Clip Area'
      this.clipModeButton.addEventListener('click', () => {
        this.mode = 'clip'
        this.updateForMode()
      }, false)
      modeSelector.appendChild(this.clipModeButton)

      this.highlightModeButton = document.createElement('button')
      this.highlightModeButton.className = 'mode-button'
      this.highlightModeButton.textContent = 'Highlight Text'
      this.highlightModeButton.addEventListener('click', () => {
        this.mode = 'highlight'
        this.updateForMode()
      }, false)
      modeSelector.appendChild(this.highlightModeButton)

      this.help = document.createElement('p')
      this.className = 'section direction'
      this.controlBox.appendChild(this.help)
    }

    updateForMode () {
      switch (this.mode) {
        case 'clip':
          this.help.textContent = 'Hover over the segment of the page you wish to clip and click.'
          this.clipModeButton.classList.add('selected')
          this.highlightModeButton.classList.remove('selected')
          break
        case 'highlight':
          this.help.textContent = 'Highlight the text you would like to clip and click the "Clip Text" button.'
          this.clipModeButton.classList.remove('selected')
          this.highlightModeButton.classList.add('selected')
          break
      }
      this.fire('modechange', this.mode)
    }
  }

  class ClipMetaController extends ClipperControlBoxController {
    constructor (content) {
      super()
      this.content = content
      this.initElement()
    }

    initElement () {
      this.controlBox = document.createElement('div')
      this.controlBox.className = 'standard-notes-control-box'

      const formSection = document.createElement('div')
      formSection.className = 'section forms'
      this.controlBox.appendChild(formSection)

      const titleField = document.createElement('input')
      titleField.type = 'text'
      titleField.className = 'title'
      titleField.value = this.content.title
      titleField.addEventListener('keyup', () => {
        this.content.title = titleField.value
      })
      titleField.addEventListener('change', () => {
        this.content.title = titleField.value
      })
      formSection.appendChild(titleField)

      const tagsField = document.createElement('input')
      tagsField.type = 'text'
      tagsField.className = 'tags'
      tagsField.value = this.content.tags.length > 0 ? ('#' + this.content.tags.join(' #')) : ''
      tagsField.placeholder = '#Tags'
      tagsField.addEventListener('keyup', () => this.updateTags(tagsField.value))
      tagsField.addEventListener('change', () => this.updateTags(tagsField.value))
      formSection.appendChild(tagsField)

      const buttonSection = document.createElement('div')
      buttonSection.className = 'section buttons'
      this.controlBox.appendChild(buttonSection)

      const okButton = document.createElement('button')
      okButton.className = 'save'
      okButton.textContent = 'Save'
      okButton.addEventListener('click', () => {
        okButton.disabled = true
        cancelButton.disabled = true
        this.fire('done', this.content)
      })
      buttonSection.appendChild(okButton)

      const cancelButton = document.createElement('button')
      cancelButton.className = 'skip'
      cancelButton.textContent = 'Skip'
      cancelButton.addEventListener('click', () => {
        okButton.disabled = true
        cancelButton.disabled = true
        this.fire('done', null)
      })
      buttonSection.appendChild(cancelButton)
    }

    updateTags (tagsStr) {
      this.content.tags = tagsStr
        .split(' ')
        .map(tag => tag[0] === '#' ? tag.substring(1) : tag)
        .filter(tag => tag.trim() !== '')
    }
  }

  class ClipperSelector extends ClipperBase {
    start () {}

    stop () {}

    finish () {}
  }

  class DomClipperSelector extends ClipperSelector {
    constructor (shadowDomRoot) {
      super()
      this.shadowDomRoot = shadowDomRoot
      this.initHoverElement()
      this.mouseMovedHandler = (event) => this.mouseMoved(event)
      this.mouseClickedHandler = (event) => this.mouseClicked(event)
    }

    initHoverElement () {
      this.hoverElement = document.createElement('div')
      this.hoverElement.id = 'standard-notes-clipper-hover'

      const innerElement = document.createElement('div')
      innerElement.className = 'spinner'
      this.hoverElement.appendChild(innerElement)
    }

    mouseMoved (event) {
      const element = document.elementFromPoint(event.clientX, event.clientY)
      if (element && element !== this.shadowDomRoot) {
        const rect = element.getBoundingClientRect()
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        this.hoverElement.style.top = (rect.top + scrollTop) + 'px'
        this.hoverElement.style.left = (rect.left + scrollLeft) + 'px'
        this.hoverElement.style.width = rect.width + 'px'
        this.hoverElement.style.height = rect.height + 'px'
      }
    }

    mouseClicked (event) {
      const element = document.elementFromPoint(event.clientX, event.clientY)
      if (element && element !== this.shadowDomRoot) {
        this.finish()
        this.hoverElement.classList.add('selected')
        this.fire('clipped', element.innerHTML)
      }
    }

    start () {
      this.shadowDomRoot.shadowRoot.appendChild(this.hoverElement)
      document.addEventListener('mousemove', this.mouseMovedHandler, false)
      document.addEventListener('mouseup', this.mouseClickedHandler, false)
    }

    stop () {
      this.hoverElement.remove()
      document.removeEventListener('mousemove', this.mouseMovedHandler, false)
      document.removeEventListener('mouseup', this.mouseClickedHandler, false)
    }

    finish () {
      this.hoverElement.classList.add('selected')
      document.removeEventListener('mousemove', this.mouseMovedHandler, false)
      document.removeEventListener('mouseup', this.mouseClickedHandler, false)
    }
  }

  class HighlightClipperSelector extends ClipperSelector {
    constructor (shadowDomRoot) {
      super()
      this.shadowDomRoot = shadowDomRoot
      this.initGrabElement()
      this.handler = (event) => this.checkForHighlight(event)
    }

    initGrabElement () {
      this.grabButton = document.createElement('button')
      this.grabButton.className = 'highlight-grab-button'
      this.grabButton.textContent = 'Clip Text'
      this.grabButton.addEventListener('click', () => {
        this.finish()
        this.fire('clipped', window.getSelection().toString())
      }, false)
    }

    checkForHighlight () {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const rect = selection.getRangeAt(0).getBoundingClientRect()
        this.grabButton.style.top = Math.max(0, rect.top - 30) + 'px'
        this.grabButton.style.left = Math.max(0, rect.left) + 'px'
      } else {
        this.grabButton.style.top = '-100px'
        this.grabButton.style.left = '-100px'
      }
    }

    start () {
      this.shadowDomRoot.shadowRoot.appendChild(this.grabButton)
      document.addEventListener('mouseup', this.handler, false)
      document.addEventListener('keyup', this.handler, false)
    }

    stop () {
      this.grabButton.remove()
      document.removeEventListener('mouseup', this.handler, false)
      document.removeEventListener('keyup', this.handler, false)
    }

    finish () {
      this.grabButton.remove()
      document.removeEventListener('mouseup', this.handler, false)
      document.removeEventListener('keyup', this.handler, false)
    }
  }
})()
