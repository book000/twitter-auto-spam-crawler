// Mock UserScript functions for testing

const mockStorage = new Map<string, unknown>()

;(global as any).GM_getValue = jest.fn(
  (key: string, defaultValue?: unknown) => {
    return mockStorage.get(key) ?? defaultValue
  }
)
;(global as any).GM_setValue = jest.fn((key: string, value: unknown) => {
  mockStorage.set(key, value)
})
;(global as any).GM_config = jest.fn()
;(global as any).GM_config_event = 'GM_config_event'
;(global as any).addEventListener = jest.fn()

export function clearMockStorage(): void {
  mockStorage.clear()
}

export function getMockStorage(): Map<string, unknown> {
  return mockStorage
}
