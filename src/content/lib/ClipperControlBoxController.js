import ClipperBase from './ClipperBase'

export default class ClipperControlBoxController extends ClipperBase {
  getElement () {
    return this.controlBox
  }

  activate () {
    this.controlBox.classList.add('active')
  }

  deactivate () {
    this.controlBox.classList.remove('active')
  }
}
