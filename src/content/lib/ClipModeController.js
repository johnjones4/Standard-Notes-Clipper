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

    const closeButton = document.createElement('button')
    closeButton.className = 'close-button'
    closeButton.innerHTML = '&times;'
    closeButton.addEventListener('click', () => {
      this.fire('cancel')
    }, false)
    this.controlBox.appendChild(closeButton)

    const modeSelector = document.createElement('div')
    modeSelector.className = 'section mode-selector'
    this.controlBox.appendChild(modeSelector)

    this.modeButtons = [
      this.makeModeButton('Select Area', 'clip'),
      this.makeModeButton('Highlight Text', 'highlight'),
      this.makeModeButton('Article', 'article'),
      this.makeModeButton('Bookmark', 'bookmark')
    ]
    this.modeButtons.forEach(({ button }) => modeSelector.appendChild(button))

    this.help = document.createElement('p')
    this.help.className = 'section direction'
    this.controlBox.appendChild(this.help)

    const okSection = document.createElement('p')
    okSection.className = 'section ok'
    this.controlBox.appendChild(okSection)

    this.okButton = document.createElement('button')
    this.okButton.className = 'button hide'
    this.okButton.textContent = 'Clip'
    this.okButton.addEventListener('click', () => {
      this.fire('clip')
    }, false)
    okSection.appendChild(this.okButton)
  }

  makeModeButton (label, name) {
    const button = document.createElement('button')
    button.className = 'button mode-button'
    button.textContent = label
    button.addEventListener('click', () => {
      this.mode = name
      this.updateForMode()
    }, false)
    return { name, button }
  }

  hideOK () {
    this.okButton.classList.add('hide')
  }

  showOK () {
    this.okButton.classList.remove('hide')
  }

  updateForMode () {
    switch (this.mode) {
      case 'clip':
        this.help.textContent = 'Hover over the segment of the page you wish to clip and click.'
        this.hideOK()
        break
      case 'highlight':
        this.help.textContent = 'Highlight the text you would like to clip and click the "Clip Text" button.'
        this.hideOK()
        break
      case 'article':
        this.help.textContent = 'Clip the contents of this page\'s main content.'
        this.showOK()
        break
      case 'bookmark':
        this.help.textContent = 'Save just the URL for this page to a note.'
        this.showOK()
        break
    }
    this.modeButtons.forEach(({ name, button }) => {
      if (this.mode === name) {
        button.classList.add('selected')
      } else {
        button.classList.remove('selected')
      }
    })
    this.fire('modechange', this.mode)
  }
}
