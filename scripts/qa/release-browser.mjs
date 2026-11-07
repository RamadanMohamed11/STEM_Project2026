// Run with the documented CUA tab/viewport APIs; no browser launch or credentials here.
// const { runReleaseBrowserChecks } = await import('file:///E:/STEM Project/scripts/qa/release-browser.mjs')
// await runReleaseBrowserChecks(tab, await browser.capabilities.get('viewport'), origin)
export async function runReleaseBrowserChecks(tab, viewport, origin) {
  const checks = []
  function expect(condition, message) {
    if (!condition) throw new Error(message)
  }
  async function step(name, action) {
    await action()
    checks.push({ name, passed: true })
  }
  async function open(path) {
    await tab.goto(origin + path)
    await tab.getAXState({ emit: false })
  }
  const role = (name, exact = true) => tab.playwright.getByRole('link', { name, exact })
  const button = (name) => tab.playwright.getByRole('button', { name, exact: true })
  async function hasText(text) {
    return (await tab.playwright.domSnapshot()).includes(text)
  }
  await step('Home and deferred 3D loading', async () => {
    await open('/')
    expect(await hasText('Discover Chemistry'), 'Home did not load')
    const preloads = await tab.playwright.locator('link[rel="modulepreload"]').all()
    for (const preload of preloads)
      expect(!/three|LaboratoryScene/.test(await preload.getAttribute('href')), '3D preloaded')
  })
  await step('Signup required errors, focus, password visibility', async () => {
    await role('Get Started').click()
    await tab.getAXState({ emit: false })
    await button('Create Account').click()
    await tab.getAXState({ emit: false })
    expect(await hasText('Enter your full name.'), 'Missing field error')
    expect(
      await tab.playwright.evaluate(() => document.activeElement?.id === 'fullName'),
      'First invalid field did not receive focus',
    )
    await button('Show password').click()
    await tab.getAXState({ emit: false })
    expect(
      (await tab.playwright
        .getByLabel('Password (required)', { exact: true })
        .getAttribute('type')) === 'text',
      'Password toggle failed',
    )
  })
  await step('Catalog search survives refresh and history', async () => {
    await open('/experiments')
    await tab.playwright
      .getByRole('searchbox', { name: 'Search experiments', exact: true })
      .fill('salt')
    await tab.getAXState({ emit: false })
    expect((await tab.url()).includes('q=salt'), 'Search missing in URL')
    await tab.reload()
    await tab.getAXState({ emit: false })
    expect((await tab.url()).includes('q=salt'), 'Search lost on refresh')
    await role('View Experiment').click()
    await tab.getAXState({ emit: false })
    expect(await hasText('What You Will Learn'), 'Details did not load')
    await tab.back()
    await tab.getAXState({ emit: false })
    expect((await tab.url()).includes('q=salt'), 'History lost search')
    await tab.forward()
    await tab.getAXState({ emit: false })
    expect((await tab.url()).includes('exp-salt-water-001'), 'Forward failed')
  })
  await step('Planned and unknown experiments cannot launch a lab', async () => {
    await open('/experiments/exp-volume-002')
    expect((await role('Start 3D Experiment').count()) === 0, 'Planned lab is playable')
    await open('/experiments/qa-unknown')
    expect((await role('Start 3D Experiment').count()) === 0, 'Unknown lab is playable')
  })
  await step('Anonymous admin requests are denied', async () => {
    await open('/admin/questions')
    expect(await hasText('You Do Not Have Permission'), 'Admin access was not denied')
  })
  await step('Quiz unanswered guard returns to actual questions', async () => {
    await open('/experiments/exp-salt-water-001/quiz')
    await button('Review Answers').first().click()
    await tab.getAXState({ emit: false })
    await button('Submit Quiz').click()
    await tab.getAXState({ emit: false })
    expect((await button('Submit Anyway').count()) === 1, 'Missing unanswered confirmation')
    await button('Return to Questions').click()
    await tab.getAXState({ emit: false })
    expect(
      (await tab.playwright.getByRole('radio').count()) > 0,
      'Return to Questions stayed on review',
    )
  })
  await step('Quiz submission, scoring, review, and retake', async () => {
    for (let i = 0; i < 6; i++) {
      await tab.playwright.getByRole('radio').first().check()
      if (i < 5) await button('Next').click()
      await tab.getAXState({ emit: false })
    }
    await button('Review Answers').first().click()
    await tab.getAXState({ emit: false })
    await button('Submit Quiz').click()
    await tab.getAXState({ emit: false })
    expect(await hasText('Your Score'), 'Submission did not produce a score')
    await role('View Quiz Results').click()
    await tab.getAXState({ emit: false })
    expect((await button('Review Answers').count()) === 1, 'Results missing review')
    await button('Try Again').click()
    await tab.getAXState({ emit: false })
    expect((await tab.playwright.getByRole('radio').count()) > 0, 'Retake did not open questions')
    expect(!(await hasText('[checked]')), 'Retake kept an answer')
  })
  const layouts = []
  try {
    await step('Four responsive sizes: forms, details, quiz, viewport-filling lab', async () => {
      for (const size of [
        { width: 1440, height: 900 },
        { width: 1366, height: 768 },
        { width: 768, height: 1024 },
        { width: 390, height: 844 },
      ]) {
        await viewport.set(size)
        for (const path of [
          '/signup',
          '/experiments/exp-salt-water-001',
          '/experiments/exp-salt-water-001/quiz',
          '/experiments/exp-salt-water-001/lab',
        ]) {
          await open(path)
          const metrics = await tab.playwright.evaluate(() => ({
            width: document.documentElement.clientWidth,
            scrollWidth: document.documentElement.scrollWidth,
            height: document.documentElement.clientHeight,
            scrollHeight: document.documentElement.scrollHeight,
            unlabelledFields: [...document.querySelectorAll('input,select,textarea')].filter(
              (e) =>
                !e.labels?.length &&
                !e.getAttribute('aria-label') &&
                !e.getAttribute('aria-labelledby'),
            ).length,
          }))
          expect(metrics.scrollWidth <= metrics.width, `${path} overflows at ${size.width}`)
          expect(metrics.unlabelledFields === 0, `${path} has unlabelled fields`)
          if (path.endsWith('/lab'))
            expect(metrics.scrollHeight === metrics.height, 'Lab has document scrolling')
          layouts.push({ size, path, ...metrics })
        }
      }
    })
  } finally {
    await viewport.reset()
  }
  return { checks, layouts }
}
