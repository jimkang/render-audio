import { select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import toWav from 'audiobuffer-to-wav';
import { decodeArrayBuffer } from './tasks/decode-array-buffer';
import ep from 'errorback-promise';
import { to } from 'await-to-js';
import curry from 'lodash.curry';

export async function renderAudio({
  audioBuffer,
  blob,
  containerSelector,
  leftColor = 'hsl(80, 50%, 60%)',
  rightColor = 'hsl(10, 50%, 60%)',
  waveformWidth = 800,
  waveformHeight = 100,
  fitToParentWidth = false,
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

  var width = waveformWidth;
  if (fitToParentWidth) {
    width = document.body.getBoundingClientRect().width;
  }

  var objectURL = URL.createObjectURL(blob);

  var containerSel = select(containerSelector);
  var playerSel = establish({
    parentSel: containerSel,
    childTag: 'audio',
    childSelector: 'audio',
    initFn: sel => sel.attr('controls', '')
  });
  playerSel.attr('src', objectURL);

  const chCount = audioBuffer.numberOfChannels;

  containerSel.selectAll('canvas').style('display', 'none');

  for (let chIndex = 0; chIndex < chCount; ++chIndex) {
    let channelData = audioBuffer.getChannelData(chIndex);
    const canvasClass = `waveform-${chIndex}`;

    var canvasSel = establish({
      parentSel: containerSel,
      childTag: 'canvas',
      childSelector: '.' + canvasClass,
      initFn: curry(initCanvas)(canvasClass, width),
    });
    canvasSel.style('display', 'block');

    drawWaveform({
      canvasSel,
      channelData,
      color: chIndex === 0 ? leftColor : rightColor
    });
  }

  containerSel.classed('hidden', false);

  function initCanvas(canvasClass, width, sel) {
    sel.classed(canvasClass, true).classed('waveform', true).attr('width', width).attr('height', waveformHeight);
  }
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

// parentSel should be a d3 selection.
export function establish({
  parentSel,
  childTag,
  childSelector,
  initFn
}) {
  var childSel = parentSel.select(childSelector);
  if (childSel.empty()) {
    childSel = parentSel.append(childTag);
    if (initFn) {
      initFn(childSel);
    }
  }
  return childSel;
}
