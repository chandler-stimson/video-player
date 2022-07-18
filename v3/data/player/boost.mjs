import context from './context.mjs';

const boost = {};
const video = document.querySelector('video');

Object.defineProperty(video, 'boost', {
  get() {
    return context.filters.gain ? context.filters.gain.gain.value : 1;
  },
  set(v) {
    if (context.filters.gain) {
      context.filters.gain.gain.value = v;
    }
    else {
      console.warn('boosting ignored; no context found');
    }
    video.dispatchEvent(new Event('boostchange'));
  }
});

export default boost;
