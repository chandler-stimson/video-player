let worker = null;
let busy = false;
let seq = 0;

// stops an in-flight decode; the warm worker is kept for the next fallback
const abort = () => {
  seq += 1;
  if (busy) {
    busy = false;
    worker.terminate();
    worker = null;
  }
};

const stream = async (src, onChunk = () => {}, flush = () => {}) => {
  abort();
  const id = seq;
  try {
    const name = src.split('/').pop().split('?')[0] || 'input';
    const buffer = await fetch(src).then(r => {
      if (r.ok === false) {
        throw new Error('failed to fetch ' + src);
      }
      return r.arrayBuffer();
    });
    if (id !== seq) {
      // a newer stream() took over while this one was fetching
      return;
    }
    if (worker === null) {
      worker = new Worker(new URL('ffmpeg/stream-worker.js', import.meta.url));
    }
    busy = true;
    const w = worker;
    return await new Promise((resolve, reject) => {
      w.onmessage = ({data}) => {
        if (data.type === 'chunk') {
          onChunk(data.data);
        }
        else if (data.type === 'done') {
          busy = false;
          if (data.ret !== 0) {
            reject(new Error('ffmpeg exited with code ' + data.ret));
          }
          else {
            resolve(data.ret);
          }
        }
        else if (data.type === 'error') {
          busy = false;
          w.terminate();
          if (worker === w) {
            worker = null;
          }
          reject(new Error(data.message));
        }
      };
      w.onerror = e => {
        busy = false;
        if (worker === w) {
          worker = null;
        }
        reject(new Error(e.message || 'ffmpeg worker failed'));
      };
      w.postMessage({type: 'run', name, buffer}, [buffer]);
    });
  }
  finally {
    flush();
  }
};

export {abort};
export default stream;
