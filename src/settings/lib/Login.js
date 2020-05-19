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
      twofaCode: '',
      serverURL: 'https://sync.standardnotes.org/'
    }
  }

  async doLogin () {
    let serverURL = this.state.serverURL
    if (serverURL[serverURL.length - 1] !== '/') {
      serverURL = serverURL + '/'
    }
    this.setState({
      loggingIn: true,
      error: null,
      serverURL
    })
    const extraParams = {}
    if (this.state.twofaKey) {
      extraParams[this.state.twofaKey] = this.state.twofaCode
    }
    try {
      const response = await chrome.extension.getBackgroundPage().login(serverURL, this.state.email, this.state.password, extraParams)
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
    return (
      <div className='col-lg-5'>
        <form className='card' onSubmit={(event) => this.login(event)}>
          <div className='card-body'>
            <h1 className='text-center'>{ title }</h1>
            { this.state.error ? (<div className='alert alert-danger'>{ this.state.error }</div>) : null }
            <div>{ fields }</div>
            <buton className='btn btn-primary btn-block' disabled={this.state.loggingIn} type='submit' onClick={(event) => this.login(event)}>{ button }</buton>
          </div>
        </form>
        <p className='security-disclaimer text-muted'>
          <small>Only a password <a href='https://docs.standardnotes.org/specification/encryption'>generated locally from your credentials</a> will be sent, directly to the Standard Notes server at sync.standardnotes.org. This add-on only stores encryption/decryption keys and the authentication token data sent back from the server to preserve the login status. This add-on also does not store any note data - only editor and tag data.</small>
        </p>
      </div>
    )
  }

  render () {
    const title = this.state.twofaKey ? 'Two Factor Authentication' : 'Login'
    const fields = this.state.twofaKey ? [
      (<FormField required name='code' label='Code' type='text' value={this.state.twofaCode} onChange={event => this.setState({ twofaCode: event.target.value })} />)
    ] : [
      (<FormField required name='serverURL' label='Server URL' type='text' value={this.state.serverURL} onChange={event => this.setState({ serverURL: event.target.value })} />),
      (<FormField required name='email' label='E-mail' type='email' value={this.state.email} onChange={event => this.setState({ email: event.target.value })} />),
      (<FormField required name='password' label='Password' type='password' value={this.state.password} onChange={event => this.setState({ password: event.target.value })} />)
    ]
    const button = this.state.twofaKey ? 'Submit' : 'Login'
    return this.renderLoginForm(title, fields, button)
  }
}
