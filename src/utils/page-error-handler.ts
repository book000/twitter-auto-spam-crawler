import { DELAYS } from '@/core/constants'
import { DomUtils } from '@/utils/dom'
import { AsyncUtils } from '@/utils/async'

/**
 * Options for page error handling
 */
export interface PageErrorOptions {
  /** Whether to reload the page after error (default: true) */
  shouldReload?: boolean
  /** Wait time before reload in milliseconds (default: DELAYS.ERROR_RELOAD_WAIT) */
  waitTime?: number
  /** Custom error message to display instead of default */
  customMessage?: string
}

/**
 * Common error handler for page components
 *
 * Provides standardized error handling across all page components,
 * including failed page detection, logging, and reload functionality.
 */
export const PageErrorHandler = {
  /**
   * Handle page errors with standard logging and reload behavior
   *
   * @param pageName - Name of the page for logging (e.g., 'Home', 'Search')
   * @param methodName - Name of the method where error occurred
   * @param error - The error that was caught
   * @param options - Error handling options
   * @returns Promise that resolves after handling the error
   *
   * @example
   * ```typescript
   * try {
   *   await DomUtils.waitElement('.timeline')
   * } catch (error) {
   *   await PageErrorHandler.handlePageError('Home', 'runHome', error)
   *   return
   * }
   * ```
   */
  async handlePageError(
    pageName: string,
    methodName: string,
    error: unknown,
    options: PageErrorOptions = {}
  ): Promise<void> {
    const {
      shouldReload = true,
      waitTime = DELAYS.ERROR_RELOAD_WAIT,
      customMessage,
    } = options

    // Check if this is a failed page
    if (DomUtils.isFailedPage()) {
      console.error(`${methodName}: failed page.`)
    }

    // Log the error with page name
    console.error(`${methodName} (${pageName}):`, error)

    // Log the error message
    const message = customMessage ?? 'Wait 1 minute and reload.'
    console.log(message)

    // Wait and reload if needed
    if (shouldReload) {
      await AsyncUtils.delay(waitTime)
      location.reload()
    }
  },

  /**
   * Wait for an element with standard error handling
   *
   * Wraps DomUtils.waitElement with automatic error handling and reload logic.
   *
   * @param selector - CSS selector for the element
   * @param pageName - Name of the page for logging
   * @param methodName - Name of the method for logging
   * @param options - Additional options including timeout and error handling
   * @returns Promise that resolves when element is found or rejects after handling error
   *
   * @example
   * ```typescript
   * // This replaces the common try-catch pattern
   * await PageErrorHandler.waitForElementWithErrorHandling(
   *   '[role="main"]',
   *   'Home',
   *   'runHome'
   * )
   * ```
   */
  async waitForElementWithErrorHandling(
    selector: string,
    pageName: string,
    methodName: string,
    options: {
      timeout?: number
      errorOptions?: PageErrorOptions
    } = {}
  ): Promise<HTMLElement> {
    try {
      await DomUtils.waitElement(selector, options.timeout)
      // DomUtils.waitElement doesn't return the element, so we need to query for it
      const element = document.querySelector(selector)
      if (!element) {
        throw new Error(`Element ${selector} not found after waiting`)
      }
      return element as HTMLElement
    } catch (error) {
      await this.handlePageError(
        pageName,
        methodName,
        error,
        options.errorOptions
      )
      throw error // Re-throw to maintain control flow
    }
  },

  /**
   * Execute a page operation with error handling
   *
   * Wraps any async operation with standard error handling.
   * Useful for operations beyond element waiting.
   *
   * @param operation - The async operation to execute
   * @param pageName - Name of the page for logging
   * @param methodName - Name of the method for logging
   * @param options - Error handling options
   * @returns Promise that resolves with operation result or undefined after error handling
   *
   * @example
   * ```typescript
   * await PageErrorHandler.executeWithErrorHandling(
   *   async () => {
   *     // Complex page operations
   *     const element = await DomUtils.waitElement('.timeline')
   *     await processElement(element)
   *   },
   *   'Home',
   *   'processTimeline'
   * )
   * ```
   */
  async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    pageName: string,
    methodName: string,
    options: PageErrorOptions = {}
  ): Promise<T | undefined> {
    try {
      return await operation()
    } catch (error) {
      await this.handlePageError(pageName, methodName, error, options)
      return undefined
    }
  },

  /**
   * Log the start of page processing
   *
   * Provides consistent logging format across all pages.
   *
   * @param pageName - Name of the page
   * @param methodName - Name of the method
   * @param additionalInfo - Optional additional information to log
   *
   * @example
   * ```typescript
   * PageErrorHandler.logPageStart('Home', 'runHome', { userId: '12345' })
   * // Logs: "runHome: Starting Home page processing..."
   * // Logs: "runHome: Additional info: { userId: '12345' }"
   * ```
   */
  logPageStart(
    pageName: string,
    methodName: string,
    additionalInfo?: Record<string, any>
  ): void {
    console.log(`${methodName}: Starting ${pageName} page processing...`)

    if (additionalInfo) {
      console.log(`${methodName}: Additional info:`, additionalInfo)
    }
  },

  /**
   * Log page action with consistent format
   *
   * Automatically detects the calling function name from the stack trace.
   * You can optionally provide a custom method name to override the detection.
   *
   * @param action - Description of the action
   * @param methodName - Optional custom method name (auto-detected if not provided)
   *
   * @example
   * ```typescript
   * // Auto-detection (recommended)
   * PageErrorHandler.logAction('Found 10 new tweets')
   * // Logs: "runHome: Found 10 new tweets" (auto-detected from stack)
   *
   * // Manual override
   * PageErrorHandler.logAction('Found 10 new tweets', 'customMethod')
   * // Logs: "customMethod: Found 10 new tweets"
   * ```
   */
  logAction(action: string, methodName?: string): void {
    const callerName = methodName ?? this._getCallerName()
    console.log(`${callerName}: ${action}`)
  },

  /**
   * Log error with consistent format
   *
   * Automatically detects the calling function name from the stack trace.
   * You can optionally provide a custom method name to override the detection.
   *
   * @param errorMessage - Error message to log
   * @param error - Optional error object for additional details
   * @param methodName - Optional custom method name (auto-detected if not provided)
   *
   * @example
   * ```typescript
   * // Auto-detection (recommended)
   * PageErrorHandler.logError('Failed to process timeline', error)
   * // Logs: "runHome: Failed to process timeline" (auto-detected from stack)
   *
   * // Manual override
   * PageErrorHandler.logError('Failed to process timeline', error, 'customMethod')
   * // Logs: "customMethod: Failed to process timeline"
   * ```
   */
  logError(errorMessage: string, error?: unknown, methodName?: string): void {
    const callerName = methodName ?? this._getCallerName()
    console.error(`${callerName}: ${errorMessage}`)

    if (error && process.env.NODE_ENV === 'development') {
      console.error(`${callerName}: Error details:`, error)
    }
  },

  /**
   * Extract caller function name from stack trace
   *
   * @returns The name of the calling function, or 'unknown' if not detectable
   * @private
   */
  _getCallerName(): string {
    try {
      const stack = new Error('Stack trace generation').stack
      if (!stack) return 'unknown'

      // Split stack trace into lines
      const stackLines = stack.split('\n')

      // Look for the caller (skip Error(), this method, and logAction/logError)
      for (let i = 3; i < stackLines.length; i++) {
        const line = stackLines[i]

        // Match function names in various formats:
        // - "at functionName (...)"
        // - "at Object.functionName (...)"
        // - "at ClassName.functionName (...)"
        const match = /at (?:(?:Object|[A-Z]\w*)\.)?(\w+)\s*\(/.exec(line)
        if (match?.[1] && match[1] !== 'logAction' && match[1] !== 'logError') {
          return match[1]
        }
      }

      return 'unknown'
    } catch {
      return 'unknown'
    }
  },
}
