import { Component, h } from 'preact'

export default class LoggedIn extends Component {
  constructor (props) {
    super(props)
    this.state = {
      editors: [],
      preferredEditor: null
    }
  }

  componentDidMount () {
    chrome.extension.getBackgroundPage().syncInfo().then(() => this.loadValues())
  }

  async loadValues () {
    const editors = await chrome.extension.getBackgroundPage().getEditors()
    const preferredEditor = await chrome.extension.getBackgroundPage().getPreferredEditor()
    this.setState({
      editors,
      preferredEditor: preferredEditor ? preferredEditor.uuid : null
    })
  }

  async logout () {
    await chrome.extension.getBackgroundPage().logout()
    this.props.stateChanged()
  }

  setPreferredEditor (uuid) {
    this.setState({ preferredEditor: uuid })
    chrome.extension.getBackgroundPage().setPreferredEditor(uuid)
  }

  renderEditorSetting () {
    return h('form-group', {},
      h('label', {}, 'Preferred Editor'),
      h('select', {
        className: 'form-control',
        onChange: (event) => this.setPreferredEditor(event.target.value)
      }, [
        h('option', {
          value: null,
          selected: !this.state.preferredEditor
        }, 'Plain Editor')
      ].concat(this.state.editors.map((editor, i) => {
        return h('option', {
          key: i,
          value: editor.uuid,
          selected: editor.uuid === this.state.preferredEditor
        }, editor.content.name)
      })))
    )
  }

  render () {
    return h('div', { className: 'col-lg-10' },
      h('h1', {}, 'Standard Notes Clipper Settings'),
      h('fieldset', { className: 'table table-striped' },
        h('legend', {}, 'Settings'),
        this.renderEditorSetting()
      ),
      h('hr'),
      h('button', { className: 'btn btn-danger', onClick: () => this.logout() }, 'Logout')
    )
  }
}
