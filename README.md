# render-audio

Given an audio buffer or audio file blob, add a waveform rendering and a media player to the page. [Here is a demo.](https://jimkang.com/render-audio)

## Usage

    npm i render-audio

Then, in your code:

    import { renderAudio } from 'render-audio';

    renderResultAudio({
      audioBuffer: myAudioBuffer,
      containerSelector: '.the-container-that-the-waveform-and-player-should-be-in',
      leftColor: 'red',
      rightColor = 'purple',
      waveformWidth: 1280,
      waveformHeight: 200,
      onError: error => console.error(error)
    });

If you have a blob of an audio file instead of and audio buffer, pass it in the `blob` property and leave out the `audioBuffer` property.

The waveform canvas elements added or updated will have the classes `waveform-0` and (if it's a stereo signal) `waveform-1` and both of them will have `waveform` so you can get at them in CSS. e.g.:

    .waveform {
      border: dashed 2px #555;
    }

To fit the width of the waveform canvas to its parent element, pass `fitToParentWidth: true`. However, if the parent width changes, the canvas width will not change width it.

If you want to allow the user to be able to zoom and pan with the mouse or touch, pass `zoomable: true`.

## Running the demo

Once you have this source code on your computer, you can get it running by doing the following.

- Install [Node 10 or later](https://nodejs.org/).
- From the root directory of the project (the same one this README file is in), run this command: `npm i`
- Then, run `make run`. It should then say something like `Your application is ready~! Local: http://0.0.0.0:7000`
  - On Windows, you may not have `make`. In that case, you can run `npm run dev`.
  - Go to `http://0.0.0.0:7000` (or `http://localhost:7000`) in your browser. The web app will be running there.
