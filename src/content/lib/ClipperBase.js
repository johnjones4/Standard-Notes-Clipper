export default class ClipperBase {
  constructor () {
    this.handlers = {}
  }

  on (event, handler) {
    if (!this.handlers[event]) {
      this.handlers[event] = []
    }
    this.handlers[event].push(handler)
  }

  fire (event, info) {
    if (this.handlers[event]) {
      this.handlers[event].forEach(handler => {
        try {
          handler(info)
        } catch (e) {
          console.error(e)
        }
      })
    }
  }
}
