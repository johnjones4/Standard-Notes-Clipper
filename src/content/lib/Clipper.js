import ClipperBase from './ClipperBase'
import ClipModeController from './ClipModeController'
import ClipMetaController from './ClipMetaController'
import DomClipperSelector from './DomClipperSelector'
import HighlightClipperSelector from './HighlightClipperSelector'
import ArticleClipper from './ArticleClipper'
import BookmarkClipper from './BookmarkClipper'

export default class Clipper extends ClipperBase {
  constructor (content, tags, editors) {
    super()
    this.content = content
    this.tags = tags
    this.editors = editors
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
    if (this.content.text.length > 0) {
      this.fire('clipped', this.content)
    } else {
      this.updateState()
    }
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
        this.modeController.on('clip', async () => {
          try {
            let clipper = null
            switch (this.mode) {
              case 'article':
                clipper = new ArticleClipper()
                break
              case 'bookmark':
                clipper = new BookmarkClipper()
                break
            }
            if (clipper) {
              const { text, previewPlain } = await clipper.clip()
              this.content.text = text
              this.content.preview_plain = previewPlain
              this.fire('clipped', this.content)
            }
          } catch (e) {
            this.fire('error', e)
          }
        })
        this.modeController.on('cancel', () => {
          this.fire('cancel')
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
        this.metaController = new ClipMetaController(this.content, this.tags, this.editors)
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
      default:
        this.selector = null
    }
    if (this.selector) {
      this.selector.on('clipped', ({ text, previewPlain }) => {
        this.content.text = text
        this.content.preview_plain = previewPlain
        this.fire('clipped', this.content)
      })
      this.selector.start()
    }
  }
}
