import ClipperSelector from './ClipperSelector'

export default class DomClipperSelector extends ClipperSelector {
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
      this.fire('clipped', {
        text: element.innerHTML,
        previewPlain: element.textContent
      })
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
