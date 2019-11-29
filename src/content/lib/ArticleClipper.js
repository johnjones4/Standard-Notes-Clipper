import SimpleClipper from './SimpleClipper'

const selectors = [
  '[itemprop="articleBody"]',
  'article',
  'main,[role="main"]'
]

export default class ArticleClipper extends SimpleClipper {
  clip () {
    let article = null
    let i = 0
    while (!article && i < selectors.length) {
      article = document.querySelector(selectors[i])
      i++
    }
    if (!article) {
      article = document.body
    }
    return {
      text: article.innerHTML,
      previewPlain: article.textContent
    }
  }
}
