import ClipperControlBoxController from './ClipperControlBoxController'

export default class ClipMetaController extends ClipperControlBoxController {
  constructor (content, tags, editors, editor) {
    super()
    this.content = content
    this.tags = tags
    this.tagsAndSubTags = this.createSubTags(tags)
    this.editors = editors
    this.initElement()
  }

  createSubTags (tags) {
    const allSubTags = []
    tags.forEach((tag, i) => {
      const subTags = tag.split('.')
      subTags.forEach((subTag, depth) => {
        allSubTags.push({
          searchText: subTag.toLowerCase(),
          realTag: tag,
          depth
        })
      })
    })
    allSubTags.sort((a, b) => a - b)
    return allSubTags
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

    this.tagsContainer = document.createElement('div')
    this.tagsContainer.className = 'tags-container'
    formSection.appendChild(this.tagsContainer)
    this.updateCurrentTags()

    this.tagsField = document.createElement('input')
    this.tagsField.type = 'text'
    this.tagsField.className = 'tags'
    this.tagsField.placeholder = 'Add tags...'
    this.tagsField.addEventListener('keyup', () => this.updateTagSuggestions())
    this.tagsField.addEventListener('change', () => this.updateTagSuggestions())
    formSection.appendChild(this.tagsField)

    this.tagsSuggestionContainer = document.createElement('div')
    this.tagsSuggestionContainer.className = 'tags-suggestions'
    formSection.appendChild(this.tagsSuggestionContainer)

    const editorChooser = document.createElement('select')
    editorChooser.className = 'editor-chooser'
    const option = document.createElement('option')
    option.value = null
    option.textContent = 'Plain Editor'
    editorChooser.appendChild(option)
    this.editors.forEach(editor => {
      const option = document.createElement('option')
      option.value = editor.uuid
      option.textContent = editor.content.name
      option.selected = editor.uuid === this.content.editor
      editorChooser.appendChild(option)
    })
    editorChooser.addEventListener('change', () => {
      this.content.editor = editorChooser.selectedIndex > 0 ? this.editors[editorChooser.selectedIndex - 1].uuid : null
    })
    formSection.appendChild(editorChooser)

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

  updateCurrentTags () {
    this.tagsContainer.innerHTML = ''
    this.content.tags.forEach((tag, i) => {
      const button = document.createElement('button')
      button.className = 'remove-tag-button'
      button.textContent = tag
      button.addEventListener('click', () => {
        this.content.tags.splice(i, 1)
        this.updateCurrentTags()
      })
      this.tagsContainer.appendChild(button)
    })
  }

  updateTagSuggestions () {
    const tagText = (this.tagsField.value[0] === '#' ? this.tagsField.value.substring(1) : this.tagsField.value).trim()
    this.tagsSuggestionContainer.innerHTML = ''
    if (tagText.length > 0) {
      const addTagOption = (text, tag) => {
        const tagButton = document.createElement('button')
        tagButton.textContent = text
        tagButton.className = 'tags-suggestion-button'
        tagButton.addEventListener('mousedown', () => {
          this.tagsSuggestionContainer.innerHTML = ''
          this.tagsField.value = ''
          this.content.tags.push(tag)
          this.updateCurrentTags()
        }, true)
        this.tagsSuggestionContainer.appendChild(tagButton)
      }

      const suggestions = this.findTagSuggestions(tagText.toLowerCase())
      suggestions.forEach(tag => addTagOption(tag, tag))

      const noPerfectMatches = this.tags.findIndex(tag => tag.toLowerCase() === tagText.toLowerCase()) < 0
      if (noPerfectMatches) {
        addTagOption(`Create new tag "${tagText}"`, tagText)
      }
    }
  }

  findTagSuggestions (lowerCaseTagText) {
    return this.tagsAndSubTags
      .filter(tag => tag.searchText.indexOf(lowerCaseTagText) === 0)
      .map(tag => tag.realTag)
  }
}
