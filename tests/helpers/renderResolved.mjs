import { renderToReadableStream, renderToStaticMarkup } from 'react-dom/server'

// Resolve real lazy imports through React before asserting completed static HTML.
export async function renderToResolvedMarkup(element) {
  const stream = await renderToReadableStream(element)
  await stream.allReady
  await stream.cancel()
  return renderToStaticMarkup(element)
}
