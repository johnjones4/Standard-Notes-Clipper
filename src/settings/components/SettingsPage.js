import { Component } from 'preact'
import Login from './Login'
import LoggedIn from './LoggedIn'

export default class SettingsPage extends Component {
  constructor (props) {
    super(props)
    this.state = {
      mode: null
    }
  }

  componentDidMount () {
    this.checkState()
  }

  checkState () {
    chrome.storage.sync.get({
      token: null,
      params: null,
      keys: null
    }, items => {
      if (items.token === null || items.params === null || items.keys === null) {
        this.setState({ mode: 'login' })
      } else {
        this.setState({ mode: 'loggedin' })
      }
    })
  }

  renderStateElement () {
    switch (this.state.mode) {
      case 'login':
        return (<Login stateChanged={() => this.checkState()} />)
      case 'loggedin':
        return (<LoggedIn stateChanged={() => this.checkState()} />)
      default:
        return null
    }
  }

  render () {
    return (
      <div>
        <ul className='nav justify-content-end'>
          <li className='nav-item'>
            <a className='nav-link' href='https://standardnotes.org/' target='_blank'>{ 'Standard Notes Website' }</a>
          </li>
          <li className='nav-item'>
            <a className='nav-link' href='https://github.com/johnjones4/Standard-Notes-Clipper' target='_blank'>{ 'GitHub Project' }</a>
          </li>
          <li className='nav-item'>
            <a className='nav-link' href='https://github.com/johnjones4/Standard-Notes-Clipper/issues' target='_blank'>{ 'Support' }</a>
          </li>
        </ul>
        <div className='container'>
          <div className='row justify-content-md-center'>
            { this.renderStateElement() }
          </div>
        </div>
      </div>
    )
  }
}
