export type InspectorEvent =
  | { type: 'fetch'; data: any }
  | { type: 'axios'; data: any }
  | { type: 'server-action'; data: any }
  | { type: 'error'; data: any }
