'use strict';
window.SGAppleMobile = function () {
  if (window.SGNative?.appleMobile === true) return true;
  return /iPhone|iPad/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

window.SGMacDesktop = function () {
  return !window.SGAppleMobile() && (/Macintosh/.test(navigator.userAgent) || navigator.platform === 'MacIntel');
};
