/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export enum AppState {
  Capturing,
  Processing,
  Animating,
  Error,
}

// FIX: Add Frame interface to be used in geminiService.
export interface Frame {}
