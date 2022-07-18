import notify from './notify.mjs';

const video = document.querySelector('video');

Object.defineProperty(video, 'capture', {
  async value() {
    const stream = video.captureStream();
    const [track] = stream.getVideoTracks();
    if (track) {
      const imageCapture = new ImageCapture(track);
      const imageBitmap = await imageCapture.grabFrame();
      const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
      canvas.getContext('2d').drawImage(imageBitmap, 0, 0);
      const blob = await canvas.convertToBlob()
      const f = new FileReader();
      f.onload = () => {
        const a = document.createElement('a');
        a.download = 'screenshot.png';
        a.href = f.result;
        a.click();
      };
      f.readAsDataURL(blob);
    }
    else {
      notify.display('There is no video track to capture from!');
    }
  }
});
