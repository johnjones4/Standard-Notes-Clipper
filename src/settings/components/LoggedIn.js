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
      preferredEditor: preferredEditor ? preferredEditor.uuid : null,
      isContextMenuEnabled: chrome.extension.getBackgroundPage().isContextMenuEnabled(),
      isInlineImagesEnabled: chrome.extension.getBackgroundPage().isInlineImagesEnabled()
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

  async toggleContextMenuEnabled (newState) {
    if (newState) {
      await chrome.extension.getBackgroundPage().enableContextMenu()
    } else {
      await chrome.extension.getBackgroundPage().disableContextMenu()
    }
    this.setState({
      isContextMenuEnabled: chrome.extension.getBackgroundPage().isContextMenuEnabled()
    })
  }

  async toggleInlineImages (newState) {
    if (newState) {
      await chrome.extension.getBackgroundPage().enableInlineImages()
    } else {
      await chrome.extension.getBackgroundPage().disableInlineImages()
    }
    this.setState({
      isInlineImagesEnabled: chrome.extension.getBackgroundPage().isInlineImagesEnabled()
    })
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

  renderContextMenuSetting () {
    return (
      <div className='form-group'>
        <label className='checkbox'>
          <input type='checkbox' className='checkbox' name='contextMenu' checked={this.state.isContextMenuEnabled} onChange={(event) => this.toggleContextMenuEnabled(event.target.checked)} /> Enable Context (Right Click) Menu
        </label>
      </div>
    )
  }

  renderInlineImagesSetting () {
    return (
      <div className='form-group'>
        <label className='checkbox'>
          <input type='checkbox' className='checkbox' name='inlineImages' checked={this.state.isInlineImagesEnabled} onChange={(event) => this.toggleInlineImages(event.target.checked)} /> Save Images Inline
        </label>
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
          { this.renderContextMenuSetting() }
          { this.renderInlineImagesSetting() }
        </fieldset>
        <hr />
        <button className='btn btn-danger' onClick={() => this.logout()}>Logout</button>
      </div>
    )
  }
}
