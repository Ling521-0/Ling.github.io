(() => {
  const dataUrl = '/data/fcircle.json'

  function safeUrl(value) {
    try {
      const url = new URL(String(value || ''), window.location.origin)
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : ''
    } catch {
      return ''
    }
  }

  function text(value) {
    return value == null ? '' : String(value)
  }

  function element(tag, className, value) {
    const node = document.createElement(tag)
    if (className) node.className = className
    if (value != null) node.textContent = text(value)
    return node
  }

  function formatDate(value) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return text(value)
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  function makeAvatar(author) {
    const avatarUrl = safeUrl(author && author.avatar)
    if (avatarUrl) {
      const avatar = document.createElement('img')
      avatar.className = 'fcircle-card__avatar'
      avatar.src = avatarUrl
      avatar.alt = `${text(author && author.name) || '朋友'}的头像`
      return avatar
    }

    return element('span', 'fcircle-card__avatar fcircle-card__avatar--fallback', (text(author && author.name) || '?').slice(0, 1))
  }

  function renderEntry(entry) {
    const author = entry && entry.author ? entry.author : {}
    const link = safeUrl(entry && entry.url)
    const coverUrl = safeUrl(entry && entry.cover)
    const card = element('article', 'fcircle-card')
    const heading = element('div', 'fcircle-card__heading')
    const identity = element('div', 'fcircle-card__identity')
    const name = element('strong', '', author.name || '未命名朋友')
    const meta = element('span', '', author.siteName || '朋友圈')
    const date = element('time', 'fcircle-card__date', formatDate(entry && entry.publishedAt))
    const body = element('div', 'fcircle-card__body')
    const title = element('h3', '', entry && entry.title)
    const summary = element('p', '', entry && entry.summary)

    identity.append(name, meta)
    heading.append(makeAvatar(author), identity, date)
    body.append(title, summary)

    if (entry && entry.tag) body.append(element('span', 'fcircle-card__tag', entry.tag))

    if (link) {
      const articleLink = document.createElement('a')
      articleLink.className = 'fcircle-card__link'
      articleLink.href = link
      articleLink.target = '_blank'
      articleLink.rel = 'noopener noreferrer'
      articleLink.setAttribute('aria-label', `打开 ${text(entry && entry.title)}`)

      if (coverUrl) {
        const cover = document.createElement('img')
        cover.src = coverUrl
        cover.alt = ''
        cover.loading = 'lazy'
        articleLink.append(cover)
      } else {
        articleLink.textContent = '阅读全文'
      }

      card.append(heading, body, articleLink)
    } else {
      card.append(heading, body)
    }

    return card
  }

  async function loadFriendCircle() {
    const feed = document.getElementById('fcircle-feed')
    const count = document.getElementById('fcircle-count')
    if (!feed || !count) return

    try {
      const response = await fetch(dataUrl, { cache: 'no-store' })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const payload = await response.json()
      const entries = Array.isArray(payload.entries) ? payload.entries : []

      feed.replaceChildren(...entries.map(renderEntry))
      count.textContent = entries.length ? `最近 ${entries.length} 条动态` : '还没有动态'
      if (!entries.length) feed.append(element('p', 'fcircle-page__empty', '这里还没有朋友圈动态。'))
    } catch {
      feed.replaceChildren(element('p', 'fcircle-page__empty', '朋友圈暂时无法读取，请稍后再试。'))
      count.textContent = '读取失败'
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFriendCircle, { once: true })
  } else {
    loadFriendCircle()
  }
})()
