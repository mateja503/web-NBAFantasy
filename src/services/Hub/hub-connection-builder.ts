import { InjectionToken } from '@angular/core';
import * as signalR from '@microsoft/signalr';

/**
 * How Hubservice obtains a builder for a new hub connection.
 *
 * WHY a token instead of `new signalR.HubConnectionBuilder()` inline:
 *   the inline form gives no seam — a spec cannot observe the URL that was built,
 *   the accessTokenFactory that was attached, or the handlers a hub registers,
 *   without opening a real WebSocket. Injecting the factory keeps production
 *   behaviour byte-for-byte identical (the default below) while letting tests
 *   substitute a fake connection.
 */
export type HubConnectionBuilderFactory = () => signalR.HubConnectionBuilder;

export const HUB_CONNECTION_BUILDER = new InjectionToken<HubConnectionBuilderFactory>(
  'HUB_CONNECTION_BUILDER',
  {
    providedIn: 'root',
    factory: () => () => new signalR.HubConnectionBuilder(),
  },
);
