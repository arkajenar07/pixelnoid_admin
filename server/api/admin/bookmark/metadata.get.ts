import { defineEventHandler, getQuery, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const rawUrl = query.url as string

  if (!rawUrl) {
    throw createError({
      statusCode: 400,
      statusMessage: 'URL diperlukan'
    })
  }

  let targetUrl = rawUrl.trim()
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl
  }

  let hostname = ''
  try {
    const parsed = new URL(targetUrl)
    hostname = parsed.hostname.replace(/^www\./, '')
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Format URL tidak valid'
    })
  }

  const defaultFavicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8'
      }
    })
    clearTimeout(timeout)

    if (!response.ok) {
      return {
        url: targetUrl,
        title: hostname,
        description: '',
        favicon: defaultFavicon
      }
    }

    const html = await response.text()

    // 1. Extract Title
    let title = ''
    const ogTitleMatch = html.match(/<meta\s+[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i)
    if (ogTitleMatch && ogTitleMatch[1]) {
      title = ogTitleMatch[1]
    } else {
      const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      if (titleTagMatch && titleTagMatch[1]) {
        title = titleTagMatch[1]
      }
    }

    // 2. Extract Description
    let description = ''
    const ogDescMatch = html.match(/<meta\s+[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i)
    if (ogDescMatch && ogDescMatch[1]) {
      description = ogDescMatch[1]
    } else {
      const metaDescMatch = html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                            html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i)
      if (metaDescMatch && metaDescMatch[1]) {
        description = metaDescMatch[1]
      }
    }

    // 3. Extract Favicon if specified
    let favicon = defaultFavicon
    const iconMatch = html.match(/<link\s+[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i) ||
                      html.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i)
    if (iconMatch && iconMatch[1]) {
      const rawIcon = iconMatch[1]
      if (rawIcon.startsWith('http://') || rawIcon.startsWith('https://')) {
        favicon = rawIcon
      } else if (rawIcon.startsWith('//')) {
        favicon = 'https:' + rawIcon
      } else if (rawIcon.startsWith('/')) {
        const origin = new URL(targetUrl).origin
        favicon = origin + rawIcon
      }
    }

    // Clean entities
    const cleanTitle = decodeHtmlEntities(title.trim()) || hostname
    const cleanDesc = decodeHtmlEntities(description.trim()).substring(0, 200)

    return {
      url: targetUrl,
      title: cleanTitle,
      description: cleanDesc,
      favicon
    }
  } catch {
    // Graceful fallback to hostname
    return {
      url: targetUrl,
      title: hostname,
      description: '',
      favicon: defaultFavicon
    }
  }
})

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/\s+/g, ' ')
}
