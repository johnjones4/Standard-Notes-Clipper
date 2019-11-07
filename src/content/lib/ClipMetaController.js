import ClipperControlBoxController from './ClipperControlBoxController'

export default class ClipMetaController extends ClipperControlBoxController {
  constructor (content) {
    super()
    this.content = content
    this.initElement()
  }

  initElement () {
    this.controlBox = document.createElement('div')
    this.controlBox.className = 'standard-notes-control-box'

    const help = document.createElement('p')
    help.className = 'section direction'
    help.textContent = 'Clipped! Customize the name and add tags below, or just click "Skip" to proceed.'
    this.controlBox.appendChild(help)

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
