import { Component, h } from 'preact'
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
        return h(Login, { stateChanged: () => this.checkState() })
      case 'loggedin':
        return h(LoggedIn, { stateChanged: () => this.checkState() })
      default:
        return null
    }
  }

  render () {
    return h('div', { },
      h('ul', {
        className: 'nav justify-content-end'
      }, [
        h('li', {
          className: 'nav-item'
        }, [
          h('a', {
            className: 'nav-link',
            href: 'https://standardnotes.org/',
            target: '_blank'
          }, 'Standard Notes Website')
        ]),
        h('li', {
          className: 'nav-item'
        }, [
          h('a', {
            className: 'nav-link',
            href: 'https://github.com/johnjones4/Standard-Notes-Clipper',
            target: '_blank'
          }, 'GitHub Project')
        ]),
        h('li', {
          className: 'nav-item'
        }, [
          h('a', {
            className: 'nav-link',
            href: 'https://github.com/johnjones4/Standard-Notes-Clipper/issues',
            target: '_blank'
          }, 'Support')
        ])
      ]),
      h('div', { className: 'container' },
        h('div', { className: 'row justify-content-md-center' },
          this.renderStateElement()
        )
      )
    )
  }
}
