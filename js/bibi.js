(() => {
  const dataUrl = '/data/bibi.json'

  function safeUrl(value) {
    try {
      const url = new URL(String(value), window.location.origin)
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : ''
    } catch {
      return ''
    }
  }

  function appendText(parent, value) {
    parent.append(document.createTextNode(value == null ? '' : String(value)))
  }

  function extractImages(content) {
    const raw = String(content || '')
    const imageUrls = []
    const markdownImage = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
    const remoteImage = /https?:\/\/[^\s<>"']+?\.(?:jpe?g|png|gif|webp)(?:\?[^\s<>"']*)?/gi
    let match

    while ((match = markdownImage.exec(raw)) !== null) imageUrls.push(match[1])
    while ((match = remoteImage.exec(raw)) !== null) imageUrls.push(match[0])

    const text = raw
      .replace(/<img\b[^>]*>/gi, '')
      .replace(markdownImage, '')
      .replace(remoteImage, '')
      .trim()

    return { text, urls: [...new Set(imageUrls.map(safeUrl).filter(Boolean))] }
  }

  function createImage(url, className, alt = '') {
    const image = document.createElement('img')
    image.src = url
    image.alt = alt
    if (className) image.className = className
    return image
  }

  function createBadge() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    svg.setAttribute('viewBox', '0 0 512 512')
    svg.setAttribute('class', 'is-badge')
    circle.setAttribute('cx', '256')
    circle.setAttribute('cy', '256')
    circle.setAttribute('r', '224')
    circle.setAttribute('fill', '#1da1f2')
    path.setAttribute('d', 'M144 264l72 72 152-168')
    path.setAttribute('fill', 'none')
    path.setAttribute('stroke', '#fff')
    path.setAttribute('stroke-width', '40')
    path.setAttribute('stroke-linecap', 'round')
    path.setAttribute('stroke-linejoin', 'round')
    svg.append(circle, path)
    return svg
  }

  function renderItem(item) {
    const card = document.createElement('article')
    const header = document.createElement('div')
    const avatar = document.createElement('div')
    const name = document.createElement('div')
    const time = document.createElement('time')
    const content = document.createElement('div')
    const footer = document.createElement('div')
    const label = document.createElement('div')
    const formatted = extractImages(item && item.content)
    const avatarUrl = safeUrl(item && item.author && item.author.avatar)
    const tagColor = item && item.tag && item.tag.bgColor

    card.className = 'bb-card'
    header.className = 'card-header'
    avatar.className = 'avatar'
    name.className = 'name'
    time.className = 'card-time'
    content.className = 'card-content'
    footer.className = 'card-footer'
    label.className = 'card-label'

    if (avatarUrl) avatar.append(createImage(avatarUrl, 'nofancybox', ''))
    appendText(name, item && item.author && item.author.nickName)
    appendText(time, item && item.createdAt ? String(item.createdAt).slice(0, 10) : '')
    appendText(content, formatted.text)
    formatted.urls.forEach(url => {
      const link = document.createElement('a')
      link.href = url
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.dataset.fancybox = 'group'
      link.className = 'fancybox'
      link.append(createImage(url, '', '唠叨配图'))
      content.append(document.createElement('br'), link)
    })
    if (typeof tagColor === 'string' && CSS.supports('color', tagColor)) label.style.backgroundColor = tagColor
    appendText(label, item && item.tag && item.tag.name)

    header.append(avatar, name, createBadge(), time)
    footer.append(label)
    card.append(header, content, footer)
    return card
  }

  function showError(container, message) {
    const error = document.createElement('p')
    error.id = 'bb_error'
    error.className = 'bb-info'
    error.textContent = message
    container.append(error)
  }

  async function loadEntries() {
    const container = document.getElementById('bibi')
    const list = document.getElementById('bb-main')
    if (!container || !list || list.dataset.loaded === 'true') return

    list.dataset.loaded = 'true'
    const loading = createImage('/assets/loading3.gif', '', '加载中')
    loading.id = 'bb_loading'
    container.append(loading)

    try {
      const response = await fetch(dataUrl, { cache: 'no-store' })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      const entries = Array.isArray(data && data.entries) ? data.entries : []
      const info = container.querySelector('.bb-info')
      if (info) info.textContent = `站长的唠叨(${entries.length})`

      if (entries.length) entries.forEach(item => list.append(renderItem(item)))
      else showError(container, '还没有唠叨，写下第一条吧。')
    } catch (error) {
      console.error('Unable to load local bibi entries.', error)
      showError(container, '本地唠叨无法加载，请检查 data/bibi.json。')
    } finally {
      loading.remove()
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadEntries, { once: true })
  else loadEntries()
})()
