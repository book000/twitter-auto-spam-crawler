import { DELAYS } from '@/core/constants'
import { DomUtils } from '@/utils/dom'
import { AsyncUtils } from '@/utils/async'

/** Options for how a page error is handled. */
export interface PageErrorOptions {
  /** Reload the page after logging the error (default: true) */
  shouldReload?: boolean
  /** Milliseconds to wait before reloading (default: DELAYS.ERROR_RELOAD_WAIT) */
  waitTime?: number
  /** Message logged instead of the default "Wait 1 minute and reload." */
  customMessage?: string
}

/**
 * Error handling and logging shared by all page components.
 *
 * Every public method takes an optional method name that labels its log output.
 * When it is omitted, the name is derived from the call stack, which only
 * works for stack traces in the V8 format.
 */
export const PageErrorHandler = {
  /**
   * Logs a page error and, unless disabled, reloads the page after a delay.
   * Also logs a separate message if X's error page is showing.
   *
   * @param pageName - Page name used in the log output (e.g. 'Home')
   * @param methodNameOrError - The method name, or the error when the method
   *   name is omitted. A string here is always taken as the method name.
   * @param errorOrOptions - The error (when a method name is given) or the
   *   options (when it is omitted)
   * @param optionsArg - Options, when a method name is given
   * @returns A promise that resolves after logging, or after the delay if a
   *   reload was scheduled
   */
  async handlePageError(
    pageName: string,
    methodNameOrError: unknown,
    errorOrOptions?: any,
    optionsArg?: PageErrorOptions
  ): Promise<void> {
    let methodName: string
    let error: unknown
    let options: PageErrorOptions

    if (typeof methodNameOrError === 'string') {
      methodName = methodNameOrError
      error = errorOrOptions
      options = optionsArg ?? {}
    } else {
      methodName = PageErrorHandler._getCallerName()
      error = methodNameOrError
      options =
        errorOrOptions !== undefined &&
        errorOrOptions !== null &&
        typeof errorOrOptions === 'object'
          ? (errorOrOptions as PageErrorOptions)
          : {}
    }

    const {
      shouldReload = true,
      waitTime = DELAYS.ERROR_RELOAD_WAIT,
      customMessage = 'Wait 1 minute and reload.',
    } = options

    if (DomUtils.isFailedPage()) {
      console.error(`${methodName}: failed page.`)
    }

    console.error(`${methodName} (${pageName}):`, error)
    console.log(customMessage)

    if (!shouldReload) {
      return
    }

    await AsyncUtils.delay(waitTime)
    location.reload()
  },

  /**
   * Waits for an element with DomUtils.waitElement; if that fails, handles
   * the error with `handlePageError` and rethrows it.
   *
   * @param selector - CSS selector of the element to wait for
   * @param pageName - Page name used in the log output
   * @param methodNameOrOptions - The method name, or the options when the
   *   method name is omitted
   * @param optionsArg - Options, when a method name is given.
   *   `timeout` is in seconds, as in DomUtils.waitElement.
   * @returns The element once it is found
   * @throws The original error, after it has been handled
   */
  async waitForElementWithErrorHandling(
    selector: string,
    pageName: string,
    methodNameOrOptions?:
      | string
      | {
          timeout?: number
          errorOptions?: PageErrorOptions
        },
    optionsArg?: {
      timeout?: number
      errorOptions?: PageErrorOptions
    }
  ): Promise<HTMLElement> {
    let methodName: string
    let options: {
      timeout?: number
      errorOptions?: PageErrorOptions
    }

    if (typeof methodNameOrOptions === 'string') {
      methodName = methodNameOrOptions
      options = optionsArg ?? {}
    } else {
      methodName = PageErrorHandler._getCallerName()
      options = methodNameOrOptions ?? {}
    }

    try {
      await DomUtils.waitElement(selector, options.timeout)
      // waitElement resolves without the element, so query it again
      const element = document.querySelector(selector)
      if (!element) {
        throw new Error(`Element ${selector} not found after waiting`)
      }
      return element as HTMLElement
    } catch (error) {
      await PageErrorHandler.handlePageError(
        pageName,
        methodName,
        error,
        options.errorOptions
      )
      throw error // Callers must still stop after a failed wait
    }
  },

  /**
   * Runs an async operation and handles any error with `handlePageError`
   * instead of propagating it.
   *
   * @param operation - The async operation to run
   * @param pageName - Page name used in the log output
   * @param methodNameOrOptions - The method name, or the options when the
   *   method name is omitted
   * @param optionsArg - Options, when a method name is given
   * @returns The result of `operation`, or undefined if it threw
   */
  async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    pageName: string,
    methodNameOrOptions?: string | PageErrorOptions,
    optionsArg?: PageErrorOptions
  ): Promise<T | undefined> {
    let methodName: string
    let options: PageErrorOptions

    if (typeof methodNameOrOptions === 'string') {
      methodName = methodNameOrOptions
      options = optionsArg ?? {}
    } else {
      methodName = PageErrorHandler._getCallerName()
      options = methodNameOrOptions ?? {}
    }

    try {
      return await operation()
    } catch (error) {
      await PageErrorHandler.handlePageError(
        pageName,
        methodName,
        error,
        options
      )
      return undefined
    }
  },

  /**
   * Logs the start of a page's processing, plus the additional info if given.
   *
   * @param pageName - Page name used in the log output
   * @param methodNameOrAdditionalInfo - The method name, or the additional
   *   info when the method name is omitted
   * @param additionalInfoArg - Additional info, when a method name is given
   */
  logPageStart(
    pageName: string,
    methodNameOrAdditionalInfo?: string | Record<string, any>,
    additionalInfoArg?: Record<string, any>
  ): void {
    let methodName: string
    let additionalInfo: Record<string, any> | undefined

    if (typeof methodNameOrAdditionalInfo === 'string') {
      methodName = methodNameOrAdditionalInfo
      additionalInfo = additionalInfoArg
    } else {
      methodName = PageErrorHandler._getCallerName()
      additionalInfo = methodNameOrAdditionalInfo
    }

    console.log(`${methodName}: Starting ${pageName} page processing...`)

    if (additionalInfo) {
      console.log(`${methodName}: Additional info:`, additionalInfo)
    }
  },

  /**
   * Logs a page action prefixed with the method name.
   *
   * @param action - Description of the action
   * @param methodName - Overrides the method name derived from the call stack
   */
  logAction(action: string, methodName?: string): void {
    const callerName = methodName ?? PageErrorHandler._getCallerName()
    console.log(`${callerName}: ${action}`)
  },

  /**
   * Logs an error message prefixed with the method name.
   * The error object itself is logged only when NODE_ENV is 'development'.
   *
   * @param errorMessage - The message to log
   * @param error - Error whose details are logged in development
   * @param methodName - Overrides the method name derived from the call stack
   */
  logError(errorMessage: string, error?: unknown, methodName?: string): void {
    const callerName = methodName ?? PageErrorHandler._getCallerName()
    console.error(`${callerName}: ${errorMessage}`)

    if (error && process.env.NODE_ENV === 'development') {
      console.error(`${callerName}: Error details:`, error)
    }
  },

  /**
   * Derives the name of the function that called the public method that
   * called this one, from the V8-style stack trace.
   *
   * @returns The caller's function name, or 'unknown' if it cannot be found
   */
  _getCallerName(): string {
    try {
      const stack = new Error('Stack trace generation').stack
      if (!stack) return 'unknown'

      const stackLines = stack.split('\n')

      // Line 0 is the error message, 1 is this method and 2 is the public
      // method that called it, so the real caller starts at line 3.
      for (let i = 3; i < stackLines.length; i++) {
        const line = stackLines[i]

        // Matches "at fn (", "at Object.fn (" and "at ClassName.fn ("
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
