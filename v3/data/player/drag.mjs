import hls from './hls.mjs';

const drag = {
  cs: [],
  onDrag(c) {
    drag.cs.push(c);
  }
};

const LINK_RE = /https?:\/\/[^\s<>"'`]+/g;

const parseLinks = text => {
  const entries = [];
  const seen = new Set();
  for (const match of text.matchAll(LINK_RE)) {
    const src = match[0].replace(/[.,;:!?)\]}'"]+$/, '');
    if (src && seen.has(src) === false) {
      seen.add(src);
      entries.push({src});
    }
  }
  return entries;
};

const drop = async es => {
  const files = [];
  const entries = es.map(f => f.webkitGetAsEntry ? f.webkitGetAsEntry() : ({
    isFile: true,
    file(c) {
      c(f);
    }
  })).filter(a => a);

  const checkEntry = async entry => {
    const file = await new Promise(resolve => entry.file(resolve));
    if (entry.fullPath) {
      file.path = entry.fullPath.replace(/^\//, '');
    }
    if (file.type) {
      if (file.type.startsWith('audio/') || file.type.startsWith('video/') ||
          file.type.includes('mpegurl') || hls.isPlaylist(file.name)) {
        files.push(file);
      }
    }
    else {
      if (file.name.startsWith('.') === false) {
        files.push(file);
      }
    }
  };

  const readEntries = entry => new Promise(resolve => {
    const directoryReader = entry.createReader();
    directoryReader.readEntries(async entries => {
      for (const entry of entries) {
        if (entry.isFile) {
          await checkEntry(entry);
        }
        else {
          await readEntries(entry);
        }
      }
      resolve();
    });
  });

  for (const entry of entries) {
    if (entry.isFile) {
      await checkEntry(entry);
    }
    else {
      await readEntries(entry);
    }
  }

  if (files.length) {
    for (const c of drag.cs) {
      c(files);
    }
  }
};

document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('paste', e => {
  const text = (e.clipboardData || {}).getData('text/plain') || '';
  const entries = parseLinks(text);
  if (entries.length) {
    e.preventDefault();
    for (const c of drag.cs) {
      c(entries);
    }
  }
});
document.addEventListener('drop', e => {
  e.preventDefault();

  const src = e.dataTransfer.getData('text/uri-list');

  if (src) {
    for (const c of drag.cs) {
      c([{src}]);
    }
  }

  drop([...e.dataTransfer.items]);
});
const container = document.getElementById('video-container');

document.getElementById('file').onchange = e => {
  const input = e.target;
  if (input.files.length) {
    drop([...input.files]);
  }
  e.target.value = '';
};

container.addEventListener('dblclick', e => {
  if (e.target === container) {
    const file = document.getElementById('file');
    file.click();
  }
});

// ChromeOS
if (self.launchQueue) {
  self.launchQueue.setConsumer(async launchParams => {
    if (!launchParams.files || !launchParams.files.length) {
      return;
    }
    const files = [];
    for (const fileHandle of launchParams.files) {
      const file = await fileHandle.getFile();
      files.push(file);
    }
    drop(files);
  });
}

export default drag;
