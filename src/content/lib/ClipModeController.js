import ClipperControlBoxController from './ClipperControlBoxController'

export default class ClipModeController extends ClipperControlBoxController {
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

    const closeButton = document.createElement('button')
    closeButton.className = 'close-button'
    closeButton.innerHTML = '&times;'
    closeButton.addEventListener('click', () => {
      this.fire('cancel')
    }, false)
    modeSelector.appendChild(closeButton)

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
    this.help.className = 'section direction'
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
