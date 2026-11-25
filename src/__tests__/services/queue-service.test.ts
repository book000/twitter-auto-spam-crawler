import { QueueService } from '../../services/queue-service'
import { Storage } from '../../core/storage'
import { clearMockStorage } from '../../__mocks__/userscript'

describe('QueueService', () => {
  beforeEach(() => {
    clearMockStorage()
    jest.clearAllMocks()
    jest.clearAllTimers()
    Storage.clearCache()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  it('reports checked and waiting membership', () => {
    GM_setValue('checkedTweets', ['checked'])
    GM_setValue('waitingTweets', ['waiting'])

    expect(QueueService.isCheckedTweet('checked')).toBe(true)
    expect(QueueService.isCheckedTweet('missing')).toBe(false)
    expect(QueueService.isWaitingTweet('waiting')).toBe(true)
    expect(QueueService.isWaitingTweet('missing')).toBe(false)
  })

  it('adds new IDs in order without duplicates or checked IDs', async () => {
    GM_setValue('waitingTweets', ['existing'])
    GM_setValue('checkedTweets', ['checked'])

    const pending = QueueService.addWaitingTweets([
      'new2',
      'new1',
      'existing',
      'new2',
      'checked',
    ])
    expect(Storage.getWaitingTweets()).toEqual(['existing', 'new2', 'new1'])
    await jest.advanceTimersByTimeAsync(1000)
    await pending
  })

  it('keeps the queue when adding no IDs', async () => {
    GM_setValue('waitingTweets', ['existing'])

    const pending = QueueService.addWaitingTweets([])
    expect(Storage.getWaitingTweets()).toEqual(['existing'])
    await jest.advanceTimersByTimeAsync(1000)
    await pending
  })

  it('returns the oldest waiting ID without removing it', () => {
    GM_setValue('waitingTweets', ['first', 'second'])

    expect(QueueService.getNextWaitingTweet()).toBe('first')
    expect(QueueService.getNextWaitingTweet()).toBe('first')
  })

  it('returns null for an empty queue', () => {
    expect(QueueService.getNextWaitingTweet()).toBeNull()
  })

  it('moves an ID from waiting to checked while preserving other IDs', async () => {
    GM_setValue('checkedTweets', ['checked'])
    GM_setValue('waitingTweets', ['target', 'waiting'])

    const pending = QueueService.checkedTweet('target')
    expect(Storage.getCheckedTweets()).toEqual(['checked', 'target'])
    expect(Storage.getWaitingTweets()).toEqual(['waiting'])
    await jest.advanceTimersByTimeAsync(1000)
    await pending
  })

  it('checks an ID that is not waiting without changing the queue', async () => {
    GM_setValue('waitingTweets', ['waiting'])

    const pending = QueueService.checkedTweet('target')
    expect(Storage.getCheckedTweets()).toEqual(['target'])
    expect(Storage.getWaitingTweets()).toEqual(['waiting'])
    await jest.advanceTimersByTimeAsync(1000)
    await pending
  })

  it('resets waiting IDs while keeping checked IDs', () => {
    GM_setValue('waitingTweets', ['first', 'second'])
    GM_setValue('checkedTweets', ['checked'])

    QueueService.resetWaitingQueue()
    expect(Storage.getWaitingTweets()).toEqual([])
    expect(Storage.getCheckedTweets()).toEqual(['checked'])
  })
})
