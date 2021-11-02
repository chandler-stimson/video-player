const filters = {};
let c;

const once = () => {
  c = new(window.AudioContext || window.webkitAudioContext);
  const video = document.querySelector('video');
  const source = c.createMediaElementSource(video);
  const gain = c.createGain();
  source.connect(gain);
  gain.connect(c.destination);

  filters.gain = gain;
  document.removeEventListener('click', once);
};
document.addEventListener('click', once);

const context = {
  get filters() {
    return filters;
  },
  get context() {
    return c;
  }
};

export default context;
