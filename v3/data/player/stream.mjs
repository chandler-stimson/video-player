/* global createFFmpegCore */

const parseArgs = (Core, args) => {
  const argsPtr = Core._malloc(args.length * Uint32Array.BYTES_PER_ELEMENT);
  args.forEach((s, idx) => {
    const buf = Core._malloc(s.length + 1);
    Core.writeAsciiToMemory(s, buf);
    Core.setValue(argsPtr + (Uint32Array.BYTES_PER_ELEMENT * idx), buf, 'i32');
  });
  return [args.length, argsPtr];
};

const stream = async (src, segment = () => {}, flush = () => {}) => {
  let index = 0;
  let done = false;
  const Core = await createFFmpegCore({
    mainScriptUrlOrBlob: 'ffmpeg-core.js',
    printErr(msg) {
      console.info(msg);
    },
    print(msg) {
      if (msg === 'FFMPEG_END') {
        done = true;
      }
    },
    locateFile(path, prefix) {
      return prefix + path;
    }
  });

  const name = src.split('/').pop() || 'unknown';

  const buffer = await fetch(src).then(r => r.arrayBuffer());
  Core.FS.writeFile(name, new Uint8Array(buffer));


  const args = [
    './ffmpeg',
    '-nostdin',
    '-y',
    '-i',
    name,
    '-g',
    '1',
    // Encode for MediaStream
    '-segment_format_options',
    'movflags=frag_keyframe+empty_moov+default_base_moof',
    // encode 5 second segments
    '-segment_time',
    '5',
    // write to files by index
    '-f',
    'segment',
    '%d.mp4'
  ];
  Core.cwrap('proxy_main', 'number', ['number', 'number'])(...parseArgs(Core, args));

  const check = () => {
    for (;;) {
      const name = [`${index}.mp4`, `${index + 1}.mp4`];
      if (
        (Core.FS.readdir('/').includes(name[0]) && done) ||
        (Core.FS.readdir('/').includes(name[0]) && Core.FS.readdir('/').includes(name[1]))
      ) {
        index += 1;

        segment(Core.FS.readFile(name[0]));
        Core.FS.unlink(name[0]);
      }
      else {
        if (done) {
          clearInterval(id);
          flush();
        }
        break;
      }
    }
  };

  const id = setInterval(check, 100);
};

export default stream;
