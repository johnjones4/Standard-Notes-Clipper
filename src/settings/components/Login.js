import { Component, h } from 'preact'
import FormField from './FormField'

export default class Login extends Component {
  constructor (props) {
    super(props)
    this.state = {
      email: '',
      password: '',
      error: null,
      loggingIn: false,
      twofaKey: null,
      twofaCode: ''
    }
  }

  async doLogin () {
    this.setState({
      loggingIn: true,
      error: null
    })
    const extraParams = {}
    if (this.state.twofaKey) {
      extraParams[this.state.twofaKey] = this.state.twofaCode
    }
    try {
      const response = await chrome.extension.getBackgroundPage().login(this.state.email, this.state.password, extraParams)
      if (response && (response.tag === 'mfa-required' || response.tag === 'mfa-invalid')) {
        this.setState({
          twofaKey: response.payload.mfa_key,
          twofaCode: '',
          loggingIn: false,
          error: response.message
        })
      } else {
        this.props.stateChanged()
      }
    } catch (err) {
      this.setState({
        twofaKey: null,
        twofaCode: '',
        loggingIn: false,
        error: err.message
      })
      console.error(err)
    }
  }

  login (event) {
    event.preventDefault()
    this.doLogin()
    return false
  }

  renderLoginForm (title, fields, button) {
    return h('div', { className: 'col-lg-5' },
      h('form', { className: 'card', onSubmit: (event) => this.login(event) },
        h('div', { className: 'card-body' },
          h('h1', { className: 'text-center' }, title),
          this.state.error ? h('div', { role: 'alert', className: 'alert alert-danger' }, this.state.error) : null,
          h('div', {}, fields),
          h('button', { className: 'btn btn-primary btn-block', disabled: this.state.loggingIn, type: 'submit', onClick: (event) => this.login(event) }, button)
        )
      )
    )
  }

  render () {
    const title = this.state.twofaKey ? 'Two Factor Authentication' : 'Login'
    const fields = this.state.twofaKey ? [
      h(FormField, { required: true, name: 'code', label: 'Code', type: 'text', value: this.state.twofaCode, onChange: (event) => this.setState({ twofaCode: event.target.value }) })
    ] : [
      h(FormField, { required: true, name: 'email', label: 'E-mail', type: 'email', value: this.state.email, onChange: (event) => this.setState({ email: event.target.value }) }),
      h(FormField, { required: true, name: 'password', label: 'Password', type: 'password', value: this.state.password, onChange: (event) => this.setState({ password: event.target.value }) })
    ]
    const button = this.state.twofaKey ? 'Submit' : 'Login'
    return this.renderLoginForm(title, fields, button)
  }
}
