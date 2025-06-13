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

    it('should auto-detect caller name when not provided', async () => {
      // Create a named function to ensure stack trace detection
      async function testFunction() {
        await PageErrorHandler.handlePageError('Test', new Error('test error'))
      }

      await testFunction()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/testFunction \(Test\):/),
        expect.any(Error)
      )
    })

    it('should auto-detect caller name with options', async () => {
      // Create a named function to ensure stack trace detection
      async function anotherTestFunction() {
        await PageErrorHandler.handlePageError(
          'Test',
          new Error('test error'),
          { customMessage: 'Auto-detected error' }
        )
      }

      await anotherTestFunction()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/anotherTestFunction \(Test\):/),
        expect.any(Error)
      )
      expect(consoleLogSpy).toHaveBeenCalledWith('Auto-detected error')
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

    it('should auto-detect caller name when not provided', async () => {
      const mockElement = document.createElement('div')
      mockElement.classList.add('test-selector')
      document.body.append(mockElement)

      jest.mocked(DomUtils.waitElement).mockResolvedValue(undefined)

      // Create a named function to ensure stack trace detection
      // eslint-disable-next-line unicorn/consistent-function-scoping
      const waitElementTest = async () => {
        return await PageErrorHandler.waitForElementWithErrorHandling(
          '.test-selector',
          'Test'
        )
      }

      const result = await waitElementTest()

      expect(result).toBe(mockElement)
      mockElement.remove()
    })

    it('should auto-detect caller name with options when error occurs', async () => {
      const testError = new Error('Element not found')
      jest.mocked(DomUtils.waitElement).mockRejectedValue(testError)

      // Create a named function to ensure stack trace detection
      // eslint-disable-next-line unicorn/consistent-function-scoping
      const waitElementErrorTest = async () => {
        return await PageErrorHandler.waitForElementWithErrorHandling(
          '.test-selector',
          'Test',
          { errorOptions: { shouldReload: false } }
        )
      }

      await expect(waitElementErrorTest()).rejects.toThrow(testError)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/waitElementErrorTest \(Test\):/),
        testError
      )
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

    it('should auto-detect caller name when not provided', async () => {
      const expectedResult = { data: 'test' }
      const operation = jest.fn().mockResolvedValue(expectedResult)

      // Create a named function to ensure stack trace detection
      async function executeTest() {
        return await PageErrorHandler.executeWithErrorHandling(
          operation,
          'Test'
        )
      }

      const result = await executeTest()

      expect(result).toBe(expectedResult)
      expect(operation).toHaveBeenCalled()
    })

    it('should auto-detect caller name with options when error occurs', async () => {
      const testError = new Error('Operation failed')
      const operation = jest.fn().mockRejectedValue(testError)

      // Create a named function to ensure stack trace detection
      async function executeErrorTest() {
        return await PageErrorHandler.executeWithErrorHandling(
          operation,
          'Test',
          { shouldReload: false }
        )
      }

      const result = await executeErrorTest()

      expect(result).toBeUndefined()
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/executeErrorTest \(Test\):/),
        testError
      )
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

    it('should auto-detect caller name when not provided', () => {
      // Create a named function to ensure stack trace detection
      // eslint-disable-next-line unicorn/consistent-function-scoping
      const startTest = () => {
        PageErrorHandler.logPageStart('Test')
      }

      startTest()

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'startTest: Starting Test page processing...'
      )
    })

    it('should auto-detect caller name with additional info', () => {
      const additionalInfo = { userId: '12345' }

      // Create a named function to ensure stack trace detection
      function startTestWithInfo() {
        PageErrorHandler.logPageStart('Test', additionalInfo)
      }

      startTestWithInfo()

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'startTestWithInfo: Starting Test page processing...'
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'startTestWithInfo: Additional info:',
        additionalInfo
      )
    })
  })

  describe('logAction', () => {
    it('should log action with method name prefix', () => {
      PageErrorHandler.logAction('Processing 10 items', 'runTest')

      expect(consoleLogSpy).toHaveBeenCalledWith('runTest: Processing 10 items')
    })

    it('should auto-detect caller name when not provided', () => {
      // Create a named function to ensure stack trace detection
      // eslint-disable-next-line unicorn/consistent-function-scoping
      const processItems = () => {
        PageErrorHandler.logAction('Processing 10 items')
      }

      processItems()

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'processItems: Processing 10 items'
      )
    })
  })

  describe('logError', () => {
    it('should log error message', () => {
      PageErrorHandler.logError('Failed to process items', undefined, 'runTest')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'runTest: Failed to process items'
      )
    })

    it('should log error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const testError = new Error('Detailed error')
      PageErrorHandler.logError('Failed to process items', testError)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\w+: Failed to process items/)
      )
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\w+: Error details:/),
        testError
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should not log error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const testError = new Error('Detailed error')
      PageErrorHandler.logError('Failed to process items', testError)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\w+: Failed to process items/)
      )
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/\w+: Error details:/),
        testError
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should auto-detect caller name when not provided', () => {
      // Create a named function to ensure stack trace detection
      // eslint-disable-next-line unicorn/consistent-function-scoping
      const errorTest = () => {
        PageErrorHandler.logError('Failed to process items')
      }

      errorTest()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'errorTest: Failed to process items'
      )
    })

    it('should auto-detect caller name with error details in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const testError = new Error('Detailed error')

      // Create a named function to ensure stack trace detection
      function errorDetailTest() {
        PageErrorHandler.logError('Failed to process items', testError)
      }

      errorDetailTest()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'errorDetailTest: Failed to process items'
      )
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'errorDetailTest: Error details:',
        testError
      )

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('_getCallerName', () => {
    it('should extract function name from stack trace', () => {
      // In Jest environment, the stack trace might be different
      // We can verify the method works by checking it returns a valid string
      const result = PageErrorHandler._getCallerName()
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle when Error constructor throws', () => {
      // Mock Error constructor to throw
      const OriginalError = globalThis.Error
      globalThis.Error = jest.fn().mockImplementation(() => {
        throw new OriginalError('Error constructor failed')
      }) as any

      const result = PageErrorHandler._getCallerName()
      expect(result).toBe('unknown')

      // Restore original Error constructor
      globalThis.Error = OriginalError
    })

    it('should return unknown for malformed stack traces', () => {
      // Mock Error to return a malformed stack
      const OriginalError = globalThis.Error
      globalThis.Error = jest.fn().mockImplementation(() => ({
        stack: 'malformed stack trace without function names',
      })) as any

      const result = PageErrorHandler._getCallerName()
      expect(result).toBe('unknown')

      // Restore original Error constructor
      globalThis.Error = OriginalError
    })

    it('should return unknown when stack is undefined', () => {
      // Mock Error to return no stack
      const OriginalError = globalThis.Error
      globalThis.Error = jest.fn().mockImplementation(() => ({
        stack: undefined,
      })) as any

      const result = PageErrorHandler._getCallerName()
      expect(result).toBe('unknown')

      // Restore original Error constructor
      globalThis.Error = OriginalError
    })
  })
})
