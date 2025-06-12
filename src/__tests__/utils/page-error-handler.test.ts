import { PageErrorHandler } from '@/utils/page-error-handler'
import { DomUtils } from '@/utils/dom'
import { AsyncUtils } from '@/utils/async'
import { DELAYS } from '@/core/constants'

// Mock dependencies
jest.mock('@/utils/dom')
jest.mock('@/utils/async')

// Note: location.reload is difficult to mock in JSDOM, so we focus on testing the logic
// and delay calls rather than the actual reload

describe('PageErrorHandler', () => {
  let consoleErrorSpy: jest.SpyInstance
  let consoleLogSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()

    // Setup default mocks
    jest.mocked(DomUtils.isFailedPage).mockReturnValue(false)
    jest.mocked(AsyncUtils.delay).mockResolvedValue()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })

  describe('handlePageError', () => {
    it('should detect failed page and log error', async () => {
      jest.mocked(DomUtils.isFailedPage).mockReturnValue(true)

      await PageErrorHandler.handlePageError(
        'Test',
        'runTest',
        new Error('test error')
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith('runTest: failed page.')
    })

    it('should log default message and reload after delay', async () => {
      await PageErrorHandler.handlePageError(
        'Test',
        'runTest',
        new Error('test error')
      )

      expect(consoleLogSpy).toHaveBeenCalledWith('Wait 1 minute and reload.')
      expect(AsyncUtils.delay).toHaveBeenCalledWith(DELAYS.ERROR_RELOAD_WAIT)
      // Note: location.reload is called but we skip testing it due to JSDOM limitations
    })

    it('should use custom message when provided', async () => {
      await PageErrorHandler.handlePageError(
        'Test',
        'runTest',
        new Error('test error'),
        { customMessage: 'Custom error message' }
      )

      expect(consoleLogSpy).toHaveBeenCalledWith('Custom error message')
    })

    it('should use custom wait time when provided', async () => {
      const customWaitTime = 5000

      await PageErrorHandler.handlePageError(
        'Test',
        'runTest',
        new Error('test error'),
        { waitTime: customWaitTime }
      )

      expect(AsyncUtils.delay).toHaveBeenCalledWith(customWaitTime)
    })

    it('should not reload when shouldReload is false', async () => {
      await PageErrorHandler.handlePageError(
        'Test',
        'runTest',
        new Error('test error'),
        { shouldReload: false }
      )

      expect(AsyncUtils.delay).not.toHaveBeenCalled()
      // Note: shouldReload=false prevents location.reload from being called
    })
  })

  describe('waitForElementWithErrorHandling', () => {
    it('should return element when found successfully', async () => {
      const mockElement = document.createElement('div')
      mockElement.classList.add('test-selector')
      document.body.append(mockElement)

      jest.mocked(DomUtils.waitElement).mockResolvedValue(undefined)

      const result = await PageErrorHandler.waitForElementWithErrorHandling(
        '.test-selector',
        'Test',
        'runTest'
      )

      expect(result).toBe(mockElement)
      expect(DomUtils.waitElement).toHaveBeenCalledWith(
        '.test-selector',
        undefined
      )

      // Clean up
      mockElement.remove()
    })

    it('should handle error and re-throw when element not found', async () => {
      const testError = new Error('Element not found')
      jest.mocked(DomUtils.waitElement).mockRejectedValue(testError)

      await expect(
        PageErrorHandler.waitForElementWithErrorHandling(
          '.test-selector',
          'Test',
          'runTest'
        )
      ).rejects.toThrow(testError)

      expect(consoleLogSpy).toHaveBeenCalledWith('Wait 1 minute and reload.')
      // Note: PageErrorHandler.handlePageError calls location.reload internally
    })

    it('should pass timeout option to waitElement', async () => {
      const mockElement = document.createElement('div')
      mockElement.classList.add('test-selector')
      document.body.append(mockElement)

      jest.mocked(DomUtils.waitElement).mockResolvedValue(undefined)
      const customTimeout = 5000

      await PageErrorHandler.waitForElementWithErrorHandling(
        '.test-selector',
        'Test',
        'runTest',
        { timeout: customTimeout }
      )

      expect(DomUtils.waitElement).toHaveBeenCalledWith(
        '.test-selector',
        customTimeout
      )

      // Clean up
      mockElement.remove()
    })

    it('should pass error options when handling error', async () => {
      const testError = new Error('Element not found')
      jest.mocked(DomUtils.waitElement).mockRejectedValue(testError)

      await expect(
        PageErrorHandler.waitForElementWithErrorHandling(
          '.test-selector',
          'Test',
          'runTest',
          {
            errorOptions: {
              shouldReload: false,
              customMessage: 'Custom wait error',
            },
          }
        )
      ).rejects.toThrow(testError)

      expect(consoleLogSpy).toHaveBeenCalledWith('Custom wait error')
      // Note: shouldReload=false prevents location.reload
    })
  })

  describe('executeWithErrorHandling', () => {
    it('should return operation result when successful', async () => {
      const expectedResult = { data: 'test' }
      const operation = jest.fn().mockResolvedValue(expectedResult)

      const result = await PageErrorHandler.executeWithErrorHandling(
        operation,
        'Test',
        'runTest'
      )

      expect(result).toBe(expectedResult)
      expect(operation).toHaveBeenCalled()
    })

    it('should handle error and return undefined when operation fails', async () => {
      const testError = new Error('Operation failed')
      const operation = jest.fn().mockRejectedValue(testError)

      const result = await PageErrorHandler.executeWithErrorHandling(
        operation,
        'Test',
        'runTest'
      )

      expect(result).toBeUndefined()
      expect(consoleLogSpy).toHaveBeenCalledWith('Wait 1 minute and reload.')
      // Note: PageErrorHandler.handlePageError calls location.reload internally
    })

    it('should use custom error options', async () => {
      const testError = new Error('Operation failed')
      const operation = jest.fn().mockRejectedValue(testError)

      await PageErrorHandler.executeWithErrorHandling(
        operation,
        'Test',
        'runTest',
        {
          shouldReload: false,
          customMessage: 'Operation failed gracefully',
        }
      )

      expect(consoleLogSpy).toHaveBeenCalledWith('Operation failed gracefully')
      // Note: custom shouldReload=false prevents location.reload
    })
  })

  describe('logPageStart', () => {
    it('should log page start message', () => {
      PageErrorHandler.logPageStart('Test', 'runTest')

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'runTest: Starting Test page processing...'
      )
    })

    it('should log additional info when provided', () => {
      const additionalInfo = { userId: '12345', mode: 'debug' }

      PageErrorHandler.logPageStart('Test', 'runTest', additionalInfo)

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'runTest: Starting Test page processing...'
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'runTest: Additional info:',
        additionalInfo
      )
    })
  })

  describe('logAction', () => {
    it('should log action with method name prefix', () => {
      PageErrorHandler.logAction('runTest', 'Processing 10 items')

      expect(consoleLogSpy).toHaveBeenCalledWith('runTest: Processing 10 items')
    })
  })

  describe('logError', () => {
    it('should log error message', () => {
      PageErrorHandler.logError('runTest', 'Failed to process items')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'runTest: Failed to process items'
      )
    })

    it('should log error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const testError = new Error('Detailed error')
      PageErrorHandler.logError('runTest', 'Failed to process items', testError)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'runTest: Failed to process items'
      )
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'runTest: Error details:',
        testError
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should not log error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const testError = new Error('Detailed error')
      PageErrorHandler.logError('runTest', 'Failed to process items', testError)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'runTest: Failed to process items'
      )
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        'runTest: Error details:',
        testError
      )

      process.env.NODE_ENV = originalEnv
    })
  })
})
