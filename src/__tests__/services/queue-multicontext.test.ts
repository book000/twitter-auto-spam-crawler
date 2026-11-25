import { clearMockStorage, getMockStorage } from '../../__mocks__/userscript'

function createContext() {
  let context!: {
    queue: typeof import('../../services/queue-service').QueueService
    storage: typeof import('../../core/storage').Storage
  }
  jest.isolateModules(() => {
    context = {
      queue: jest.requireActual<typeof import('../../services/queue-service')>(
        '../../services/queue-service'
      ).QueueService,
      storage:
        jest.requireActual<typeof import('../../core/storage')>(
          '../../core/storage'
        ).Storage,
    }
  })
  return context
}

describe('queue across userscript contexts', () => {
  beforeEach(() => {
    clearMockStorage()
    jest.clearAllMocks()
  })

  afterEach(async () => {
    await jest.runOnlyPendingTimersAsync()
  })

  it('preserves checked IDs written by another context', () => {
    GM_setValue('checkedTweets', ['first'])
    const first = createContext()
    const second = createContext()

    expect(first.queue.isCheckedTweet('first')).toBe(true)
    expect(second.queue.isCheckedTweet('first')).toBe(true)
    void second.queue.checkedTweet('other-tab')
    void first.queue.checkedTweet('this-tab')

    expect(first.storage.getCheckedTweets()).toEqual([
      'first',
      'other-tab',
      'this-tab',
    ])
    expect(second.queue.isCheckedTweet('this-tab')).toBe(true)
    expect(GM_getValue('checkedTweets', [])).toEqual(['first'])
  })

  it('preserves checked writes interleaved after both contexts read', () => {
    const first = createContext()
    const second = createContext()
    first.storage.getCheckedTweetsSet()
    second.storage.getCheckedTweetsSet()
    ;(GM_setValue as jest.Mock).mockImplementationOnce((key, value) => {
      void second.queue.checkedTweet('other-tab')
      getMockStorage().set(key, value)
    })

    void first.queue.checkedTweet('this-tab')

    expect(first.storage.getCheckedTweetsSet()).toEqual(
      new Set(['this-tab', 'other-tab'])
    )
    expect(second.storage.getCheckedTweetsSet()).toEqual(
      first.storage.getCheckedTweetsSet()
    )
  })

  it('preserves waiting adds interleaved between reading and writing', () => {
    GM_setValue('waitingTweets', ['legacy'])
    const first = createContext()
    const second = createContext()
    const snapshot = first.storage.getWaitingTweetsSet()
    ;(GM_setValue as jest.Mock).mockImplementationOnce((key, value) => {
      void second.queue.addWaitingTweets(['other-tab'])
      getMockStorage().set(key, value)
    })

    void first.queue.addWaitingTweets(['this-tab'])

    expect(first.storage.getWaitingTweetsSet()).toEqual(
      new Set(['legacy', 'this-tab', 'other-tab'])
    )
    expect(second.queue.isWaitingTweet('this-tab')).toBe(true)
    snapshot.add('unpersisted')
    expect(first.queue.isWaitingTweet('unpersisted')).toBe(false)
  })

  it('keeps checked status when another context enqueues the same ID', () => {
    const first = createContext()
    const second = createContext()
    ;(GM_setValue as jest.Mock).mockImplementationOnce((key, value) => {
      void second.queue.checkedTweet('target')
      getMockStorage().set(key, value)
    })

    void first.queue.addWaitingTweets(['target', 'unrelated'])

    expect(first.queue.isCheckedTweet('target')).toBe(true)
    expect(second.queue.isWaitingTweet('target')).toBe(false)
    expect(first.queue.getNextWaitingTweet()).toBe('unrelated')
  })

  it('keeps checked status when an enqueue interrupts a checked write', () => {
    const first = createContext()
    const second = createContext()
    ;(GM_setValue as jest.Mock).mockImplementationOnce((key, value) => {
      void second.queue.addWaitingTweets(['target'])
      getMockStorage().set(key, value)
    })

    void first.queue.checkedTweet('target')

    expect(first.queue.isCheckedTweet('target')).toBe(true)
    expect(second.queue.isWaitingTweet('target')).toBe(false)
    expect(second.queue.getNextWaitingTweet()).toBeNull()
  })

  it('does not restore a checked waiting ID from a stale snapshot', () => {
    GM_setValue('waitingTweets', ['target', 'keep'])
    const first = createContext()
    const second = createContext()
    first.storage.getWaitingTweetsSet()

    void second.queue.checkedTweet('target')
    void first.queue.addWaitingTweets(['new'])

    expect(first.storage.getWaitingTweets()).toEqual(['keep', 'new'])
    expect(second.storage.getWaitingTweets()).toEqual(['keep', 'new'])
  })

  it('does not restore reset legacy IDs after another context writes or reloads', () => {
    GM_setValue('waitingTweets', ['old'])
    const first = createContext()
    const second = createContext()
    first.storage.getWaitingTweetsSet()

    second.queue.resetWaitingQueue()
    void first.queue.addWaitingTweets(['new'])

    expect(first.storage.getWaitingTweets()).toEqual(['new'])
    expect(createContext().storage.getWaitingTweets()).toEqual(['new'])
    expect(GM_getValue('waitingTweets', [])).toEqual(['old'])
  })

  it('keeps an unrelated add made while a reset is writing', () => {
    GM_setValue('waitingTweets', ['old'])
    const first = createContext()
    const second = createContext()
    ;(GM_setValue as jest.Mock).mockImplementationOnce((key, value) => {
      void second.queue.addWaitingTweets(['new'])
      getMockStorage().set(key, value)
    })

    first.queue.resetWaitingQueue()

    expect(first.storage.getWaitingTweets()).toEqual(['new'])
    expect(second.storage.getWaitingTweets()).toEqual(['new'])
  })

  it('allows explicitly enqueueing a reset ID and keeps enqueue order', () => {
    GM_setValue('waitingTweets', ['old', 'older'])
    const first = createContext()
    const second = createContext()

    first.queue.resetWaitingQueue()
    void second.queue.addWaitingTweets(['z', 'old', 'a'])

    const records = getMockStorage().entries().toArray().toReversed()
    getMockStorage().clear()
    for (const [key, value] of records) getMockStorage().set(key, value)

    expect(first.storage.getWaitingTweets()).toEqual(['z', 'old', 'a'])
    expect(createContext().storage.getWaitingTweets()).toEqual([
      'z',
      'old',
      'a',
    ])
  })

  it('refreshes reads of legacy arrays written by another context', () => {
    const first = createContext()
    expect(first.queue.isCheckedTweet('remote')).toBe(false)
    expect(first.queue.isWaitingTweet('remote')).toBe(false)

    GM_setValue('waitingTweets', ['remote'])
    expect(first.queue.isWaitingTweet('remote')).toBe(true)
    GM_setValue('checkedTweets', ['remote'])
    expect(first.queue.isCheckedTweet('remote')).toBe(true)
    expect(first.queue.isWaitingTweet('remote')).toBe(false)
  })
})
