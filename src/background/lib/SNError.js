export default class SNError extends Error {
  constructor (message, serverInfo) {
    super(message, null, null)
    this.serverInfo = serverInfo
  }
}
