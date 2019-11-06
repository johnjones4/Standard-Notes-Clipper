import ClipperSelector from './ClipperSelector'

export default class HighlightClipperSelector extends ClipperSelector {
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
      this.fire('clipped', {
        text: window.getSelection().toString(),
        previewPlain: window.getSelection().toString()
      })
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
