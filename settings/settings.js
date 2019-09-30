const { Component, h, render } = window.preact

const FormField = (props) => {
  return h('div', { className: 'form-group'},
    h('label', { for: props.name }, props.label),
    h('input', { onChange: (event) => props.onChange(event), required: props.required, name: props.name, id: props.name, type: props.type, placeholder: props.placeholder, className: 'form-control', value: props.value }, props.for)
  )
}

class Login extends Component {
  constructor (props) {
    super(props)
    this.state = {
      email: '',
      password: '',
      error: null,
      loggingIn: false
    }
  }

  login (event) {
    event.preventDefault()
    this.setState({
      loggingIn: true
    })
    chrome.extension.getBackgroundPage().login(this.state.email, this.state.password)
      .then(() => this.props.stateChanged())
      .catch(err => {
        this.setState({
          loggingIn: false,
          error: err.message
        })
        console.error(err)
      })
    return false
  }

  render () {
    return h('div', { className: 'col-lg-5' },
      h('form', { className: 'card', onSubmit: (event) => this.login(event) },
        h('div', { className: 'card-body' },
          h('h1', { className: 'text-center' }, 'Login'),
          this.state.error ? h('div', { role: 'alert', className: 'alert alert-danger'}, this.state.error) : null,
          h(FormField, { required: true, name: 'email', label: 'E-mail', type: 'email', value: this.state.email, onChange: (event) => this.setState({email: event.target.value}) }),
          h(FormField, { required: true,  name: 'password', label: 'Password', type: 'password', value: this.state.password, onChange: (event) => this.setState({password: event.target.value}) }),
          h('button', {className: 'btn btn-primary btn-block', disabled: this.state.loggingIn, type: 'submit', onClick: (event) => this.login(event)}, 'Login')
        )
      )
    )
  }
}

class Logout extends Component {
  logout () {
    chrome.extension.getBackgroundPage().logout().then(() => this.props.stateChanged())
  }

  render () {
    return h('div', {className: 'text-center'},
      h('p', {}, 'Logged in to Standard Notes!'),
      h('button', {className: 'btn btn-primary', onClick: () => this.logout()}, 'Logout')
    )
  }
}

class SettingsPage extends Component {
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
        this.setState({ mode: 'logout' })
      }
    })
  }

  renderStateElement () {
    switch (this.state.mode) {
      case 'login':
        return h(Login, { stateChanged: () => this.checkState() })
      case 'logout':
        return h(Logout, { stateChanged: () => this.checkState() })
      default:
        return null
    }
  }

  render () {
    return h('div', { className: 'container' },
      h('div', { className: 'row justify-content-md-center' },
        this.renderStateElement()
      )
    )
  }
}

render(h(SettingsPage), document.getElementById('options'))
