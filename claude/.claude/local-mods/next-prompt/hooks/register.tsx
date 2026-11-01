import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Suggestion } from '../types'

const suggestion = atom({ plugin: 'next-prompt', key: 'suggestion' } as const, null as Suggestion)

const ASK = [
  '[This message is from the next-prompt mod, not the user.]',
  'Predict the next message the user will type in this conversation.',
  'Reply with only that message, written in their voice as they would type it,',
  'at most 25 words, no quotes, no preamble.',
  'If no follow-up is likely, reply NONE.',
].join(' ')

const MAX_CHARS = 300

// strip quotes and reject non-answers; undefined means show nothing
const clean = (raw: string): string | undefined => {
  const text = raw.trim().replace(/^["'`]+|["'`]+$/g, '').trim()
  if (text === '' || /^none\.?$/i.test(text) || text.length > MAX_CHARS) {
    return undefined
  }

  return text
}

export const register: Register = on => {
  // bumped on every prompt, so a guess that resolves after the next prompt is dropped
  let generation = 0
  // the field's text as edited, for the guess it started from; kept out of state so a
  // write never redraws over the typing
  let draft = { guess: '', text: '' }

  on('prompt.submit', async ($, e, next) => {
    // a photo sent from the main box with no text takes the row's text: the row itself
    // can't attach images
    const hasImage = e.attachments?.some(a => a.type === 'image') ?? false
    const rowText = draft.guess === '' ? '' : draft.text.trim()
    const merged = hasImage && e.text.trim() === '' && rowText !== ''

    generation += 1
    draft = { guess: '', text: '' }
    // never hold up the prompt on clearing the band
    update($, suggestion, () => null).catch((err: unknown) =>
      $.ui.log(`next-prompt: could not clear (${String(err)})`),
    )

    return next(merged ? { ...e, text: rowText } : e)
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (e.agentId !== undefined || e.reason !== 'answer') {
      return result
    }

    const mine = generation
    void (async () => {
      const reply = await $.model.fork({ prompt: ASK })
      if (!reply.isAnswered) {
        $.ui.log(`next-prompt: no guess (${reply.reason})`)
        return
      }

      const text = clean(reply.text)
      if (text === undefined || mine !== generation) {
        return
      }

      await update($, suggestion, () => text)
    })()

    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const text = await read($, suggestion)
    if (text === null || e.props.hasSurvey || e.props.isWorking) {
      return next(e)
    }

    if (draft.guess !== text) {
      draft = { guess: text, text }
    }

    const elements = $.ui.resolve(e)
    const { Box, Button, Text } = elements
    const send = async () => {
      const message = draft.text
      if (message.trim() === '') {
        return
      }
      // the mod's own submit skips its own prompt.submit hook, so reset here too
      generation += 1
      draft = { guess: '', text: '' }
      await update($, suggestion, () => null)
      // the person pressed send on text they could edit: read it bare, as their own words
      await $.prompt.submit({ text: message, asUser: true })
    }

    // mobile draws no text field yet: show the guess as text there
    const guess =
      e.surface !== 'mobile' && 'Input' in elements ? (
        <elements.Input
          key="draft"
          label="Next: "
          value={draft.text}
          rows={2}
          submitLabel="↵"
          onInput={(value: string) => {
            draft.text = value
          }}
          onSubmit={(value: string) => {
            draft.text = value
            return send()
          }}
        />
      ) : (
        <Text>Next: {draft.text} </Text>
      )

    return (
      <Box alignItems="center" gap={1}>
        <Box flexGrow={1}>{guess}</Box>
        <Button key="send" label="Send" variant="primary" onPress={send} />
        <Button
          key="dismiss"
          label="Dismiss"
          onPress={() => {
            draft = { guess: '', text: '' }
            return update($, suggestion, () => null)
          }}
        />
      </Box>
    )
  })
}
