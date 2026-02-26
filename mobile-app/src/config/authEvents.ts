// src/config/authEvents.ts
import { EventEmitter } from 'eventemitter3';

export const authEvents = new EventEmitter();
export const AUTH_LOGOUT_EVENT = 'force-logout';