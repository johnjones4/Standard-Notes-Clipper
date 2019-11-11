import ClipperControlBoxController from './ClipperControlBoxController'

export default class ClipMetaController extends ClipperControlBoxController {
  constructor (content, tags) {
    super()
    this.content = content
    this.tags = tags
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

    this.tagsField = document.createElement('input')
    this.tagsField.type = 'text'
    this.tagsField.className = 'tags'
    this.tagsField.placeholder = '#Tags'
    this.tagsField.addEventListener('keyup', () => this.updateTags())
    this.tagsField.addEventListener('change', () => this.updateTags())
    formSection.appendChild(this.tagsField)
    this.setTagsField()

    this.tagsSuggestionContainer = document.createElement('div')
    this.tagsSuggestionContainer.className = 'tags-suggestions'
    formSection.appendChild(this.tagsSuggestionContainer)

    const buttonSection = document.createElement('div')
    buttonSection.className = 'section buttons'
    this.controlBox.appendChild(buttonSection)

    const okButton = document.createElement('button')
    okButton.className = 'button save'
    okButton.textContent = 'Save'
    okButton.addEventListener('click', () => {
      okButton.disabled = true
      cancelButton.disabled = true
      this.fire('done', this.content)
    })
    buttonSection.appendChild(okButton)

    const cancelButton = document.createElement('button')
    cancelButton.className = 'button skip'
    cancelButton.textContent = 'Skip'
    cancelButton.addEventListener('click', () => {
      okButton.disabled = true
      cancelButton.disabled = true
      this.fire('done', null)
    })
    buttonSection.appendChild(cancelButton)
  }

  setTagsField (addSpace) {
    this.tagsField.value = (this.content.tags.length > 0 ? ('#' + this.content.tags.join(' #')) : '') + (addSpace ? ' ' : '')
  }

  updateTags () {
    let newTag = false
    if (this.tagsField.value.length > 1 && this.tagsField.value[this.tagsField.value.length - 1] === ' ') {
      newTag = true
    }

    this.content.tags = this.tagsField.value
      .split(' ')
      .map(tag => tag[0] === '#' ? tag.substring(1) : tag)
      .filter(tag => tag.trim() !== '')
    this.setTagsField(newTag)

    this.tagsSuggestionContainer.innerHTML = ''
    if (!newTag && this.content.tags.length > 0 && this.content.tags[this.content.tags.length - 1].trim().length > 0) {
      const lastTag = this.content.tags[this.content.tags.length - 1]
      this.tags.filter(tag => tag.toLowerCase().indexOf(lastTag.toLowerCase()) === 0).forEach(tag => {
        const tagButton = document.createElement('button')
        tagButton.textContent = tag
        tagButton.className = 'tags-suggestion-button'
        tagButton.addEventListener('mousedown', () => {
          this.content.tags[this.content.tags.length - 1] = tag
          this.setTagsField(true)
          this.tagsSuggestionContainer.innerHTML = ''
        }, true)
        this.tagsSuggestionContainer.appendChild(tagButton)
      })
    }
  }
}
