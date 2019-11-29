import SimpleClipper from './SimpleClipper'

export default class BookmarkClipper extends SimpleClipper {
  clip () {
    return {
      text: window.location.href,
      previewPlain: window.location.href
    }
  }
}
