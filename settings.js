const background = chrome.extension.getBackgroundPage()
const optionsEl = document.getElementById('options')

const showLogin = () => {
  const loginFrame = document.createElement('div')
  loginFrame.className = 'col-lg-5'

  const loginCard = document.createElement('form')
  loginCard.className = 'card'
  loginFrame.appendChild(loginCard)

  const loginCardInner = document.createElement('div')
  loginCardInner.className = 'card-body'
  loginCard.appendChild(loginCardInner)

  loginCardInner.appendChild(makeHeader('Login To Your Account'))

  const placeholder = document.createElement('div')
  loginCardInner.appendChild(placeholder)

  const emailField = makeFormField('email', 'email', 'E-mail', null)
  loginCardInner.appendChild(emailField.formGroup)

  const passwordField = makeFormField('password', 'password', 'Password', null)
  loginCardInner.appendChild(passwordField.formGroup)

  const button = document.createElement('button')
  button.setAttribute('type', 'submit')
  button.className = 'btn btn-primary btn-block'
  button.textContent = 'Login'
  loginCardInner.appendChild(button)

  optionsEl.appendChild(loginFrame)

  const doLogin = (event) => {
    event.preventDefault()
    button.disabled = true
    placeholder.innerHTML = ''
    const email = emailField.input.value
    const password = passwordField.input.value
    background.login(email, password)
      .then(() => {
        reload()
      })
      .catch(err => {
        button.disabled = false
        console.error(err)
        placeholder.appendChild(createError(err.message))
      })
    return false
  }

  loginCard.addEventListener('submit', doLogin)
  button.addEventListener('click', doLogin)
}

const showLoggedIn = () => {
  const loggedInFrame = document.createElement('div')
  loggedInFrame.className = 'text-center'

  const messageP = document.createElement('p')
  messageP.textContent = 'Logged in to Standard Notes!'
  loggedInFrame.appendChild(messageP)

  const button = document.createElement('button')
  button.setAttribute('type', 'submit')
  button.className = 'btn btn-primary'
  button.textContent = 'Logout'
  loggedInFrame.appendChild(button)

  const doLogout = (event) => {
    event.preventDefault()
    background.logout().then(() => reload())
    return false
  }

  button.addEventListener('click', doLogout)

  optionsEl.appendChild(loggedInFrame)
}

const clearContent = () => {
  optionsEl.innerHTML = ''
}

const makeHeader = (header) => {
  const h1 = document.createElement('h1')
  h1.className = 'text-center'
  h1.textContent = header
  return h1
}

const createError = (message) => {
  const errorDiv = document.createElement('div')
  errorDiv.className = 'alert alert-danger'
  errorDiv.setAttribute('role', 'alert')
  errorDiv.textContent = message
  return errorDiv
}

const makeFormField = (name, type, labelVal, value) => {
  const formGroup = document.createElement('div')
  formGroup.className = 'form-group'

  const label = document.createElement('label')
  label.setAttribute('for', name)
  label.textContent = labelVal
  formGroup.appendChild(label)

  const input = document.createElement('input')
  input.setAttribute('name', name)
  input.setAttribute('id', name)
  input.setAttribute('type', type)
  input.setAttribute('placeholder', labelVal)
  input.className = 'form-control'
  if (value) {
    input.setAttribute('value', value)
  }
  formGroup.appendChild(input)

  return {
    formGroup,
    input
  }
}

const reload = () => {
  clearContent()
  chrome.storage.sync.get({
    token: null,
    params: null,
    keys: null
  }, items => {
    if (items.token === null || items.params === null || items.keys === null) {
      showLogin()
    } else {
      showLoggedIn()
    }
  })
}

document.addEventListener('DOMContentLoaded', () => reload())
