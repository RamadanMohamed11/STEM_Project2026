import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToResolvedMarkup as renderToStaticMarkup } from './helpers/renderResolved.mjs'
import { MemoryRouter } from 'react-router'
import { createServer } from './helpers/routeTestServer.mjs'

test('home page renders all four complete educational sections with accessible landmarks, clear English, and valid routes', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx')
    const markup = await renderToStaticMarkup(
      React.createElement(MemoryRouter, { initialEntries: ['/'] }, React.createElement(AppRoutes)),
    )

    // 1. T05 Hero remains intact
    assert.ok(markup.includes('Discover Chemistry'), 'Hero title preserved')
    assert.ok(markup.includes('Through Experiments'), 'Hero title accent preserved')
    assert.ok(markup.includes('Explore chemistry in a new way'), 'Hero description preserved')
    assert.ok(markup.includes('Get Started'), 'Hero primary CTA preserved')
    assert.ok(markup.includes('Explore Experiments'), 'Hero secondary CTA preserved')
    assert.ok(markup.includes('Full 3D Virtual Lab'), 'Hero feature highlight')

    // 2. Section 1: Website Introduction
    assert.ok(markup.includes('About STEM Virtual Lab'), 'Intro pill tag')
    assert.ok(
      markup.includes('Practical Chemistry Designed for Secondary School Students'),
      'Intro heading',
    )
    assert.ok(
      markup.includes('Built for Secondary School Science'),
      'Intro feature 1: secondary school audience',
    )
    assert.ok(
      markup.includes('Learn by Doing, Not Just Reading'),
      'Intro feature 2: learning through experiments',
    )
    assert.ok(
      markup.includes('Safe and Unlimited Practice'),
      'Intro feature 3: virtual lab benefits',
    )
    assert.ok(
      markup.includes('How the Virtual Lab Helps You Learn'),
      'Intro right-side highlights card',
    )
    assert.ok(markup.includes('href="/safety"'), 'Intro link to safety')
    assert.ok(markup.includes('href="/experiments/preview/lab"'), 'Intro link to 3D lab')

    // 3. Section 2: Chemistry in Everyday Life
    assert.ok(markup.includes('Real-World Science'), 'Everyday chemistry eyebrow')
    assert.ok(markup.includes('Chemistry in Everyday Life'), 'Everyday chemistry heading')
    assert.ok(markup.includes('Cooking Food'), 'Everyday example: cooking')
    assert.ok(markup.includes('Thermal Reactions'), 'Cooking tag')
    assert.ok(markup.includes('Rusting Iron'), 'Everyday example: rusting iron')
    assert.ok(markup.includes('Oxidation'), 'Rusting tag')
    assert.ok(markup.includes('Cleaning with Soap'), 'Everyday example: soap')
    assert.ok(markup.includes('Surfactants'), 'Soap tag')
    assert.ok(markup.includes('Everyday Materials'), 'Everyday example: materials')
    assert.ok(markup.includes('Material Science'), 'Materials tag')
    assert.ok(markup.includes('What you see:'), 'Observation prompt')
    assert.ok(markup.includes('The science behind it:'), 'Science explanation prompt')

    // 4. Section 3: Why Practical Experiments Matter
    assert.ok(markup.includes('Practical Learning'), 'Why experiments eyebrow')
    assert.ok(markup.includes('Why Practical Experiments Matter'), 'Why experiments heading')
    assert.ok(markup.includes('Understand Scientific Ideas'), 'Pillar 1: understanding ideas')
    assert.ok(markup.includes('See How Materials Change'), 'Pillar 2: observing changes')
    assert.ok(markup.includes('Learn Laboratory Tools'), 'Pillar 3: lab apparatus')
    assert.ok(markup.includes('Connect Lessons to Real Situations'), 'Pillar 4: real situations')
    assert.ok(markup.includes('Why it matters:'), 'Student takeaway prompt')

    // 5. Section 4: How the Website Works (6-step student journey)
    assert.ok(markup.includes('Student Journey'), 'How it works eyebrow')
    assert.ok(markup.includes('How the Website Works'), 'How it works heading')
    assert.ok(markup.includes('01'), 'Step 1 indicator')
    assert.ok(markup.includes('Create an Account'), 'Step 1 title')
    assert.ok(markup.includes('02'), 'Step 2 indicator')
    assert.ok(markup.includes('Learn Laboratory Safety'), 'Step 2 title')
    assert.ok(markup.includes('03'), 'Step 3 indicator')
    assert.ok(markup.includes('Choose Grade and Term'), 'Step 3 title')
    assert.ok(markup.includes('04'), 'Step 4 indicator')
    assert.ok(markup.includes('Explore Chemistry Experiments'), 'Step 4 title')
    assert.ok(markup.includes('05'), 'Step 5 indicator')
    assert.ok(markup.includes('Use the Virtual Laboratory'), 'Step 5 title')
    assert.ok(markup.includes('06'), 'Step 6 indicator')
    assert.ok(markup.includes('Test Your Knowledge'), 'Step 6 title')

    // The working journey distinguishes sample curriculum and draft practice.
    assert.ok(markup.includes('Available'), 'Available status pill')
    assert.ok(markup.includes('3D Lab Ready'), '3D Lab Ready status pill')
    assert.ok(markup.includes('Demonstration Data'), 'Sample curriculum status')
    assert.ok(markup.includes('Draft Practice'), 'Draft quiz status')
    assert.ok(!markup.includes('save your progress across lessons'), 'No account progress promise')

    // Navigation connections from 6 steps
    assert.ok(markup.includes('href="/signup"'), 'Step 1 link')
    assert.ok(markup.includes('href="/safety"'), 'Step 2 link')
    assert.ok(markup.includes('href="/grades"'), 'Step 3 link')
    assert.ok(markup.includes('href="/experiments"'), 'Step 4 link')
    assert.ok(markup.includes('href="/experiments/preview/lab"'), 'Step 5 link')
    assert.ok(markup.includes('href="/experiments/exp-salt-water-001/quiz"'), 'Step 6 link')

    // 6. Bottom prototype status note preserved
    assert.ok(markup.includes('Interactive Learning in Progress'), 'Status note preserved')
    assert.ok(markup.includes('Explore the 3D lab'), 'Explore lab link preserved')

    // 7. Strict English check - no Arabic characters
    assert.equal(
      /[\u0600-\u06FF]/.test(markup),
      false,
      'Home page markup must not contain Arabic characters',
    )
  } finally {
    await vite.close()
  }
})
