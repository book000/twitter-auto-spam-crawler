// Mock UserScript functions for testing

const mockStorage = new Map<string, unknown>()

;(globalThis as any).GM_getValue = jest.fn(
  (key: string, defaultValue?: unknown) => {
    return mockStorage.get(key) ?? defaultValue
  }
)
;(globalThis as any).GM_setValue = jest.fn((key: string, value: unknown) => {
  mockStorage.set(key, value)
})
;(globalThis as any).GM_registerMenuCommand = jest.fn((text: string, onClick: () => void) => {
  return Math.random().toString(36).substring(7) // Return mock command ID
})
;(globalThis as any).GM_unregisterMenuCommand = jest.fn((commandId: string) => {
  // Mock implementation for unregistering menu commands
})
;(globalThis as any).GM_config = jest.fn()
;(globalThis as any).GM_config_event = 'GM_config_event'
;(globalThis as any).addEventListener = jest.fn()

export function clearMockStorage(): void {
  mockStorage.clear()
}

export function getMockStorage(): Map<string, unknown> {
  return mockStorage
}
