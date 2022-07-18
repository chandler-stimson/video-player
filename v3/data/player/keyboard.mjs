import notify from './notify.mjs';

const keyboard = {};
const v = document.querySelector('video');

const rules = [{
  condition(meta, code, shift) {
    return code === 'KeyP' && meta && shift;
  },
  action() {
    document.getElementById('previous').click();

    return true;
  }
}, {
  condition(meta, code, shift) {
    return code === 'KeyN' && meta && shift;
  },
  action() {
    document.getElementById('next').click();

    return true;
  }
}, { // toggle playlist
  condition(meta, code) {
    return code === 'KeyP' && meta;
  },
  action() {
    document.getElementById('p-button').click();

    return true;
  }
}, { // change volume
  condition(meta, code) {
    if (code === 'ArrowUp' || code === 'ArrowDown') {
      return true;
    }
  },
  action(e) {
    const volume = Math.min(1, Math.max(0, Math.round(v.volume * 100 + (e.code === 'ArrowUp' ? 5 : -5)) / 100));
    try {
      v.volume = volume;
    }
    catch (e) {
      console.log(volume, e);
    }
    notify.display('Volume: ' + (v.volume * 100).toFixed(0) + '%');
    return true;
  }
}, {
  condition(meta, code) {
    return code === 'KeyB' && meta;
  },
  action() {
    document.getElementById('boost').click();

    return true;
  }
}, {
  condition(meta, code) {
    return code === 'KeyS' && meta;
  },
  action() {
    document.getElementById('capture').click();

    return true;
  }
}, {
  condition(meta, code) {
    return code === 'KeyX' && meta;
  },
  action() {
    document.getElementById('speed').click();

    return true;
  }
}];

document.addEventListener('keydown', e => {
  const meta = e.metaKey || e.ctrlKey;
  for (const {condition, action} of rules) {
    if (condition(meta, e.code, e.shiftKey)) {
      if (action(e)) {
        e.preventDefault();
      }
      break;
    }
  }
});

keyboard.register = rule => rules.push(rule);

export default keyboard;
