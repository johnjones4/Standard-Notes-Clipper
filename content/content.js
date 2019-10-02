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
          console.error(err)
        }
        return true
      case 'done':
        alert('Saved!')
        return false
      case 'error':
        alert(request.payload.error)
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

  const startClipper = () => {
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
    return clipper.attach()
      .then(() => {
        return new Promise((resolve, reject) => {
          clipper.on('clipped', (content) => {
            resolve(content)
          })
        })
      })
  }

  class Clipper {
    constructor (content) {
      this.content = content
      this.handlers = {}
      this.step = 0
      this.initHoverElement()
      this.initControlBoxElement()
      this.updateControlBoxState()
      this.mouseMovedHandler = (event) => this.mouseMoved(event)
      this.mouseClickedHandler = (event) => this.mouseClicked(event)
    }

    setStep (step) {
      this.step = step
      this.updateControlBoxState()
    }

    nextStep () {
      this.setStep(this.step + 1)
    }

    initHoverElement () {
      this.hoverElement = document.createElement('div')
      this.hoverElement.id = 'standard-notes-clipper-hover'
    }

    initControlBoxElement () {
      this.controlBox = document.createElement('div')
      this.controlBox.id = 'standard-notes-control-box'      
    }

    updateControlBoxState () {
      this.controlBox.innerHTML = ''
      switch (this.step) {
        case 0:
          const help = document.createElement('p')
          help.textContent = 'Hover over the segment of the page you wish to clip and click.'
          help.className = 'section start-direction direction'
          this.controlBox.appendChild(help)
          break
        case 1:
          const save = document.createElement('p')
          save.textContent = 'Saving ...'
          save.className = 'section start-direction saving'
          this.controlBox.appendChild(save)
          break
        case 2:
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
          buttonSection.appendChild(okButton)

          const cancelButton = document.createElement('button')
          cancelButton.className = 'skip'
          cancelButton.textContent = 'Skip'
          buttonSection.appendChild(cancelButton)
          break
      }
    }

    updateTags (tagsStr) {
      this.content.tags = tagsStr
        .split(' ')
        .map(tag => tag[0] === '#' ? tag.substring(1) : tag)
        .filter(tag => tag.trim() !== '')
    }

    on (event, handler) {
      if (!this.handlers[event]) {
        this.handlers[event] = []
      }
      this.handlers[event].push(handler)
    }

    fire (event, info) {
      if (this.handlers[event]) {
        this.handlers[event].forEach(handler => handler(info))
      }
    }

    attach () {
      this.shadowDomRoot = document.createElement('div')
      this.shadowDomRoot.style.zIndex = 100000
      document.body.appendChild(this.shadowDomRoot)
      this.shadowDomRoot.attachShadow({ mode: 'open' })
      return fetch(chrome.runtime.getURL('content/content.css'))
        .then(res => res.text())
        .then(stylesheet => {
          const style = document.createElement('style')
          style.textContent = stylesheet
          this.shadowDomRoot.shadowRoot.appendChild(style)

          this.shadowDomRoot.shadowRoot.appendChild(this.hoverElement)
          this.shadowDomRoot.shadowRoot.appendChild(this.controlBox)
          document.addEventListener('mousemove', this.mouseMovedHandler, false)
          document.addEventListener('mouseup', this.mouseClickedHandler, false)
        })
    }

    detach () {
      if (this.shadowDomRoot) {
        this.shadowDomRoot.remove()
        this.removeListeners()
      }
    }

    removeListeners () {
      document.removeEventListener('mousemove', this.mouseMovedHandler, false)
      document.removeEventListener('mouseup', this.mouseClickedHandler, false)
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
        this.removeListeners()
        this.hoverElement.classList.add('selected')
        this.controlBox.classList.add('clipped')
        this.content.text = element.innerHTML
        this.fire('clipped', this.content)
      }
    }
  }
})()
