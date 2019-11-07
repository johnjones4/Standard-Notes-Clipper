import { Component, h } from 'preact'

export default class LoggedIn extends Component {
  constructor (props) {
    super(props)
    this.state = {
      editors: null,
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
    if (!this.state.editors) {
      return 'Loading ...'
    }
    return (
      <div className='form-group'>
        <label>Preferred Editor</label>
        <select className='form-control' onChange={(event) => this.setPreferredEditor(event.target.value)}>
          <option value={null} selected={!this.state.preferredEditor}>Plain Editor</option>
          { this.state.editors.map((editor, i) => {
            return (<option key={i} value={editor.uuid} selected={editor.uuid === this.state.preferredEditor}>{ editor.content.name }</option>)
          }) }
        </select>
      </div>
    )
  }

  render () {
    return (
      <div className='col-lg-10'>
        <h1>Standard Notes Clipper Settings</h1>
        <fieldset>
          <legend>Settings</legend>
          { this.renderEditorSetting() }
        </fieldset>
        <hr/>
        <button className='btn btn-danger' onClick={ () => this.logout() }>Logout</button>
      </div>
    )
  }
}
