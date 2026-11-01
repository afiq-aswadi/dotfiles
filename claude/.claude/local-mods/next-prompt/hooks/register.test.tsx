import { expect, test } from 'claude-code/testing'

const BAND = {
  plugin: 'next-prompt',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 9 },
    view: {},
  },
} as const

const USAGE = {
  input_tokens: 0,
  output_tokens: 0,
  cache_creation_input_tokens: 0,
  cache_read_input_tokens: 0,
}

// the test runtime has timers; the mod's lib (no dom, no node) does not declare them
declare function setTimeout(callback: () => void, ms: number): unknown

// lets the mod's unawaited guess resolve
const settle = () => new Promise<void>(resolve => setTimeout(resolve, 0))

const TURN = { answer: 'done', durationMs: 1, isAborted: false, turnId: 't1' } as const

test('a guess shows in the field; Send sends it, an edit and Enter send the edit', async ($, on) => {
  const submitted: string[] = []
  on('model.fork', () => ({ value: { isAnswered: true, text: '"run the tests"', usage: USAGE } }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  on('turn.complete', () => ({ text: 'done' }))
  on('prompt.submit', (_, e) => {
    submitted.push(e.text)
    return { text: e.text }
  })

  for (const surface of ['terminal', 'desktop'] as const) {
    await $.turn.complete({ ...TURN, reason: 'answer' })
    await settle()

    const ui = await $.ui.mount({ ...BAND, surface })
    expect((await ui.find({ type: 'Input', key: 'draft' }))?.props.value).toBe('run the tests')
    await ui.press({ key: 'send' })
    expect(await ui.find({ type: 'Input', key: 'draft' })).toBeUndefined()

    await $.turn.complete({ ...TURN, reason: 'answer' })
    await settle()
    await ui.input({ key: 'draft', text: 'run the slow tests', kind: 'change' })
    await ui.input({ key: 'draft', text: 'run the slow tests too' })
    expect(await ui.find({ type: 'Input', key: 'draft' })).toBeUndefined()
    await ui.unmount()
  }

  expect(submitted).toEqual([
    'run the tests',
    'run the slow tests too',
    'run the tests',
    'run the slow tests too',
  ])
})

test('an edit is not carried over to the next guess', async ($, on) => {
  const submitted: string[] = []
  on('model.fork', () => ({ value: { isAnswered: true, text: 'run the tests', usage: USAGE } }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  on('turn.complete', () => ({ text: 'done' }))
  on('prompt.submit', (_, e) => {
    submitted.push(e.text)
    return { text: e.text }
  })

  await $.turn.complete({ ...TURN, reason: 'answer' })
  await settle()
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await ui.input({ key: 'draft', text: 'something else', kind: 'change' })
  await ui.press({ key: 'dismiss' })

  await $.turn.complete({ ...TURN, reason: 'answer' })
  await settle()
  expect((await ui.find({ type: 'Input', key: 'draft' }))?.props.value).toBe('run the tests')
  await ui.unmount()
})

for (const [name, text, agentId] of [
  ['NONE leaves the band empty', 'NONE', undefined],
  ['a subagent turn leaves the band empty', 'run the tests', 'a1'],
] as const) {
  test(name, async ($, on) => {
    on('model.fork', () => ({ value: { isAnswered: true, text, usage: USAGE } }))
    on('ui.render', ($, e) => {
      const { Text } = $.ui.resolve(e)
      return <Text>engine</Text>
    })
    on('turn.complete', () => ({ text: 'done' }))

    await $.turn.complete({ ...TURN, reason: 'answer', agentId })
    await settle()

    const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
    expect(await ui.find({ type: 'Button', key: 'send' })).toBeUndefined()
    await ui.unmount()
  })
}

test('mobile, which draws no field, shows the guess as text and Send sends it', async ($, on) => {
  const submitted: string[] = []
  on('model.fork', () => ({ value: { isAnswered: true, text: 'run the tests', usage: USAGE } }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  on('turn.complete', () => ({ text: 'done' }))
  on('prompt.submit', (_, e) => {
    submitted.push(e.text)
    return { text: e.text }
  })

  await $.turn.complete({ ...TURN, reason: 'answer' })
  await settle()
  const ui = await $.ui.mount({ ...BAND, surface: 'mobile' })
  expect((await ui.find({ type: 'Text', text: /run the tests/ }))?.text).toBe('Next: run the tests ')
  await ui.press({ key: 'send' })
  await ui.unmount()

  expect(submitted).toEqual(['run the tests'])
})

test('a photo sent with no text takes the row text; with text, or no photo, it is left alone', async ($, on) => {
  const submitted: string[] = []
  on('model.fork', () => ({ value: { isAnswered: true, text: 'run the tests', usage: USAGE } }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  on('turn.complete', () => ({ text: 'done' }))
  on('prompt.submit', (_, e) => {
    submitted.push(e.text)
    return { text: e.text }
  })
  const photo = [{ type: 'image', mediaType: 'image/png' }] as const

  for (const [text, attachments] of [
    ['', photo],
    ['my own words', photo],
    ['', undefined],
  ] as const) {
    await $.turn.complete({ ...TURN, reason: 'answer' })
    await settle()
    const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
    await ui.input({ key: 'draft', text: 'look at this plot', kind: 'change' })
    await ui.unmount()
    await $.prompt.submit({ text, attachments, origin: { kind: 'sdk' }, wait: false })
  }

  expect(submitted).toEqual(['look at this plot', 'my own words', ''])
})
