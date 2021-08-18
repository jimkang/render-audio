import { select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import toWav from 'audiobuffer-to-wav';
import { decodeArrayBuffer } from './tasks/decode-array-buffer';
import ep from 'errorback-promise';
import { to } from 'await-to-js';

export async function renderResultAudio({
  audioBuffer,
  blob,
  containerSelector,
  onError
}) {
  if (!blob) {
    blob = new Blob([toWav(audioBuffer)]);
  } else if (!audioBuffer) {
    let [abError, arrayBuffer] = await to(blob.arrayBuffer());
    if (abError) {
      onError(abError);
      return;
    }

    let { error, values } = await ep(decodeArrayBuffer, arrayBuffer);
    if (error) {
      onError(error);
      return;
    }
    audioBuffer = values[0];
  }

  var objectURL = URL.createObjectURL(blob);

  var containerSel = select(containerSelector);
  containerSel.select('audio').attr('src', objectURL);

  const chCount = audioBuffer.numberOfChannels;

  for (let chIndex = 0; chIndex < chCount; ++chIndex) {
    let channelData = audioBuffer.getChannelData(chIndex);
    drawWaveform({
      canvasSel: containerSel.select(`.waveform-${chIndex}`),
      channelData,
      color: chIndex === 0 ? 'hsl(80, 50%, 60%)' : 'hsl(10, 50%, 60%)',
    });
  }

  containerSel.classed('hidden', false);
}

function drawWaveform({ canvasSel, channelData, color }) {
  const width = canvasSel.attr('width');
  const height = canvasSel.attr('height');

  var canvasCtx = canvasSel.node().getContext('2d', { alpha: false });
  canvasCtx.clearRect(0, 0, width, height);
  canvasCtx.lineWidth = 1;

  var x = scaleLinear().domain([0, channelData.length]).range([0, width]);
  // In canvas, and GUIs in general, remember:
  // +y is down! If we want positive values to be
  // higher than negative ones, we must flip their
  // signs.
  var y = scaleLinear().domain([-1.0, 1.0]).range([height, 0]);
  canvasCtx.beginPath();
  canvasCtx.strokeStyle = color;
  canvasCtx.moveTo(0, y(0));
  for (let i = 0; i < channelData.length; ++i) {
    const val = channelData[i];
    const yPos = y(val);
    canvasCtx.lineTo(x(i), yPos);
  }
  canvasCtx.stroke();
}
