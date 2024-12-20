const protocol = window.location.protocol;
const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
const hostname = window.location.hostname;

export const WS_URL = `${wsProtocol}//${hostname}/ws`;
export const SYSTEM_WS_URL = `${wsProtocol}//${hostname}/system-ws`;
export const API_URL = `${protocol}//${hostname}`;
export const FLV_URL = `${protocol}//${hostname}`;