/**
 * Safari/WebKit often cannot sustain smooth HTML5 decoding above ~2×.
 * YouTube's player handles high rates better; generic <video>/<audio> does not.
 *
 * Strategy: keep playbackRate at a smooth cap (2×) and advance currentTime to
 * make up the remaining effective speed. Displayed/desired speed stays accurate.
 */

window.VSC = window.VSC || {};

(() => {
  const SMOOTH_CAP = 2.0;
  const TICK_MS = 250;
  const MAX_DT_S = 0.75;

  function isSafariLike() {
    if (typeof navigator === 'undefined') {
      return false;
    }
    const ua = navigator.userAgent || '';
    // Chromium also includes "Safari"; exclude it. Firefox is fine natively.
    if (/Chrome\/|Chromium\/|Edg\/|OPR\//.test(ua)) {
      return false;
    }
    return /Safari\//.test(ua) || typeof window.safari !== 'undefined';
  }

  function isYouTubeHost(hostname = typeof location !== 'undefined' ? location.hostname : '') {
    return (
      hostname === 'www.youtube.com' ||
      hostname === 'youtube.com' ||
      hostname === 'www.youtube-nocookie.com' ||
      hostname === 'youtube-nocookie.com' ||
      hostname === 'm.youtube.com'
    );
  }

  class HighRateBooster {
    constructor() {
      /** @type {WeakMap<HTMLMediaElement, object>} */
      this.states = new WeakMap();
      this.forceEnabled = false; // tests can flip this
    }

    /**
     * @param {number} desiredSpeed
     * @param {string} [hostname]
     * @returns {boolean}
     */
    isEligible(desiredSpeed, hostname) {
      if (!(this.forceEnabled || isSafariLike())) {
        return false;
      }
      if (isYouTubeHost(hostname)) {
        return false;
      }
      return desiredSpeed > SMOOTH_CAP + 0.001;
    }

    /**
     * Register value that will be written for a desired speed.
     * @param {number} desiredSpeed
     * @param {string} [hostname]
     * @returns {number}
     */
    plannedRate(desiredSpeed, hostname) {
      return this.isEligible(desiredSpeed, hostname) ? SMOOTH_CAP : desiredSpeed;
    }

    /**
     * Apply desired speed; returns the actual playbackRate written.
     * @param {HTMLMediaElement} video
     * @param {number} desiredSpeed
     * @returns {number}
     */
    apply(video, desiredSpeed) {
      const desired = Number(desiredSpeed);
      if (!video) {
        return desired;
      }

      if (video.vsc) {
        video.vsc.desiredSpeed = desired;
      }

      if (!this.isEligible(desired)) {
        this.clear(video, { keepDesired: true });
        video.playbackRate = desired;
        return desired;
      }

      let state = this.states.get(video);
      if (!state) {
        state = {
          desired,
          timer: null,
          lastTick: 0,
          userSeeking: false,
          selfSeek: false,
        };
        state.onSeeking = () => {
          if (!state.selfSeek) {
            state.userSeeking = true;
          }
        };
        state.onSeeked = () => {
          state.userSeeking = false;
          state.selfSeek = false;
          if (video.vsc) {
            video.vsc.highRateBoostSeek = false;
          }
          state.lastTick = Date.now();
        };
        state.onPause = () => {
          state.lastTick = 0;
        };
        state.onPlay = () => {
          state.lastTick = Date.now();
        };
        video.addEventListener('seeking', state.onSeeking);
        video.addEventListener('seeked', state.onSeeked);
        video.addEventListener('pause', state.onPause);
        video.addEventListener('play', state.onPlay);
        this.states.set(video, state);
      }

      state.desired = desired;

      if (video.playbackRate !== SMOOTH_CAP) {
        video.playbackRate = SMOOTH_CAP;
      }

      // Prefer pitch-preserving stretch at the smooth cap.
      try {
        if ('preservesPitch' in video) {
          video.preservesPitch = true;
        } else if ('webkitPreservesPitch' in video) {
          video.webkitPreservesPitch = true;
        }
      } catch {
        // optional
      }

      if (!state.timer) {
        state.lastTick = Date.now();
        state.timer = setInterval(() => this.tick(video), TICK_MS);
      }

      return SMOOTH_CAP;
    }

    /**
     * @param {HTMLMediaElement} video
     * @private
     */
    tick(video) {
      const state = this.states.get(video);
      if (!state) {
        return;
      }

      if (video.paused || video.ended || state.userSeeking || state.selfSeek) {
        state.lastTick = Date.now();
        return;
      }

      // Date.now() (not performance.now()) so test fake-timers and background
      // throttling share one clock for skip sizing.
      const now = Date.now();
      if (!state.lastTick) {
        state.lastTick = now;
        return;
      }

      let dt = (now - state.lastTick) / 1000;
      state.lastTick = now;
      if (dt <= 0) {
        return;
      }
      if (dt > MAX_DT_S) {
        // Tab was backgrounded or main thread stalled — don't jump a huge gap.
        dt = MAX_DT_S;
      }

      const excess = state.desired - SMOOTH_CAP;
      if (excess <= 0) {
        return;
      }

      const skip = excess * dt;
      if (skip < 0.01) {
        return;
      }

      let next = video.currentTime + skip;
      if (Number.isFinite(video.duration) && video.duration > 0) {
        next = Math.min(next, Math.max(0, video.duration - 0.05));
      }
      if (!Number.isFinite(next) || Math.abs(next - video.currentTime) < 0.01) {
        return;
      }

      state.selfSeek = true;
      if (video.vsc) {
        video.vsc.highRateBoostSeek = true;
      }

      try {
        if (typeof video.fastSeek === 'function') {
          video.fastSeek(next);
        } else {
          video.currentTime = next;
        }
      } catch {
        state.selfSeek = false;
        if (video.vsc) {
          video.vsc.highRateBoostSeek = false;
        }
      }
    }

    /**
     * @param {HTMLMediaElement} video
     * @param {{keepDesired?: boolean}} [options]
     */
    clear(video, options = {}) {
      if (!video) {
        return;
      }
      const state = this.states.get(video);
      if (!state) {
        if (!options.keepDesired && video.vsc) {
          video.vsc.desiredSpeed = undefined;
          video.vsc.highRateBoostSeek = false;
        }
        return;
      }

      if (state.timer) {
        clearInterval(state.timer);
      }
      video.removeEventListener('seeking', state.onSeeking);
      video.removeEventListener('seeked', state.onSeeked);
      video.removeEventListener('pause', state.onPause);
      video.removeEventListener('play', state.onPlay);
      this.states.delete(video);

      if (video.vsc) {
        video.vsc.highRateBoostSeek = false;
        if (!options.keepDesired) {
          video.vsc.desiredSpeed = undefined;
        }
      }
    }
  }

  window.VSC.HighRateBooster = HighRateBooster;
  window.VSC.highRateBooster = new HighRateBooster();
  window.VSC.HighRateBooster.SMOOTH_CAP = SMOOTH_CAP;
})();
