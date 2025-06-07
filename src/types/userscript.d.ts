interface GMConfigField {
  name: string
  value: string
  input: 'prompt' | 'current' | ((stored: string) => string)
  // Built-in input types: 'prompt' (dialog), 'current' (return as-is)
  // Can also accept custom input functions
  processor?:
    | 'same'
    | 'not'
    | 'int'
    | 'int_range'
    | 'float'
    | 'float_range'
    | ((value: any) => any)
  formatter?: 'normal' | 'boolean' | ((name: string, value: any) => string)
  key?: string // Access key for menu
  close?: boolean // Auto-close after input
}

type GMConfigFields = Record<string, GMConfigField>

// Note: GM_getValue and GM_setValue use JSON.stringify/parse internally,
// so they can handle any JSON-serializable value

declare global {
  // Storage functions (from @grant)
  // GM_getValue supports any serializable type (uses JSON internally)
  function GM_getValue<T = any>(key: string, defaultValue?: T): T

  // GM_setValue accepts any serializable value (uses JSON internally)
  function GM_setValue(key: string, value: any): void

  // Menu commands (from @grant)
  // Returns a menu command ID that can be used to unregister
  function GM_registerMenuCommand(
    name: string,
    callback: () => void,
    accessKey?: string
  ): number

  // Unregister a previously registered menu command
  function GM_unregisterMenuCommand(menuCommandId: number): void

  // GM_config from Tampermonkey Config library (from @require)
  // eslint-disable-next-line camelcase
  const GM_config: (fields: GMConfigFields, init?: boolean) => void

  // Event name fired by GM_config when configuration changes
  // eslint-disable-next-line camelcase
  const GM_config_event: string

  // Additional Tampermonkey APIs that might be available but not currently granted:
  // GM_addStyle, GM_deleteValue, GM_listValues, GM_getResourceText, GM_getResourceURL,
  // GM_openInTab, GM_notification, GM_setClipboard, GM_xmlhttpRequest, GM_download,
  // GM_getTab, GM_saveTab, GM_getTabs, GM_log, GM_info
}

export {}
