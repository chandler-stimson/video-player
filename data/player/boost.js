const boost = {};

const video = document.querySelector('video');
const context = new(window.AudioContext || window.webkitAudioContext);
const source = context.createMediaElementSource(video);
const gain = context.createGain();
Object.defineProperty(video, 'boost', {
  get() {
    return gain.gain.value;
  },
  set(v) {
    gain.gain.value = v;
    video.dispatchEvent(new Event('boostchange'));
  }
});

source.connect(gain);
gain.connect(context.destination);

export default boost;
