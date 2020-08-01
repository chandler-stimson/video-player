const filters = {};

const once = () => {
  const context = new(window.AudioContext || window.webkitAudioContext);
  const video = document.querySelector('video');
  const source = context.createMediaElementSource(video);
  const gain = context.createGain();
  source.connect(gain);
  gain.connect(context.destination);

  filters.gain = gain;
  document.removeEventListener('click', once);
};
document.addEventListener('click', once);

const context = {
  get filters() {
    return filters;
  }
};

export default context;
