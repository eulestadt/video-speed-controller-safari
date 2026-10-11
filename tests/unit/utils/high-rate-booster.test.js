/**
 * Safari high-rate booster unit tests
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  installChromeMock,
  cleanupChromeMock,
  resetMockStorage,
} from '../../helpers/chrome-mock.js';
import { createMockVideo, createMockDOM } from '../../helpers/test-utils.js';

describe('HighRateBooster', () => {
  let mockDOM;

  beforeEach(() => {
    installChromeMock();
    resetMockStorage();
    mockDOM = createMockDOM();
    // vitest-setup preloads modules; force Safari-like boosting for these tests
    window.VSC.highRateBooster.forceEnabled = true;
  });

  afterEach(() => {
    window.VSC.highRateBooster.forceEnabled = false;
    cleanupChromeMock();
    if (mockDOM) {
      mockDOM.cleanup();
    }
    vi.useRealTimers();
  });

  it('plans SMOOTH_CAP for speeds above 2× when eligible', () => {
    const booster = window.VSC.highRateBooster;
    expect(booster.plannedRate(2.5, 'example.com')).toBe(2.0);
    expect(booster.plannedRate(1.8, 'example.com')).toBe(1.8);
  });

  it('does not boost YouTube hosts', () => {
    const booster = window.VSC.highRateBooster;
    expect(booster.isEligible(3.0, 'www.youtube.com')).toBe(false);
    expect(booster.plannedRate(3.0, 'www.youtube.com')).toBe(3.0);
  });

  it('keeps playbackRate at 2× and stores desiredSpeed', () => {
    const video = createMockVideo({ playbackRate: 1.0 });
    video.vsc = {};
    const applied = window.VSC.highRateBooster.apply(video, 3.0);
    expect(applied).toBe(2.0);
    expect(video.playbackRate).toBe(2.0);
    expect(video.vsc.desiredSpeed).toBe(3.0);
    window.VSC.highRateBooster.clear(video);
  });

  it('advances currentTime to make up excess rate', () => {
    vi.useFakeTimers();
    const video = createMockVideo({ playbackRate: 1.0, currentTime: 10, duration: 100 });
    Object.defineProperty(video, 'paused', { value: false, writable: true, configurable: true });
    Object.defineProperty(video, 'ended', { value: false, writable: true, configurable: true });
    video.vsc = {};

    window.VSC.highRateBooster.apply(video, 3.0);
    const before = video.currentTime;
    vi.advanceTimersByTime(250);
    // excess 1.0 × 0.25s = +0.25s media time
    expect(video.currentTime).toBeCloseTo(before + 0.25, 2);
    window.VSC.highRateBooster.clear(video);
  });

  it('clears boost and restores native rate at or below 2×', () => {
    const video = createMockVideo({ playbackRate: 1.0 });
    video.vsc = {};
    window.VSC.highRateBooster.apply(video, 3.0);
    window.VSC.highRateBooster.apply(video, 1.5);
    expect(video.playbackRate).toBe(1.5);
    expect(video.vsc.desiredSpeed).toBe(1.5);
  });
});
