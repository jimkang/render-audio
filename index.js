import { select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import toWav from 'audiobuffer-to-wav';
import { decodeArrayBuffer } from './tasks/decode-array-buffer';
import ep from 'errorback-promise';
import { to } from 'await-to-js';
import curry from 'lodash.curry';
import { zoom as Zoom } from 'd3-zoom';

export async function renderAudio({
  audioBuffer,
  blob,
  containerSelector,
  leftColor = 'hsl(80, 50%, 60%)',
  rightColor = 'hsl(10, 50%, 60%)',
  waveformWidth = 800,
  waveformHeight = 100,
  fitToParentWidth = false,
  zoomable = false,
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
    renderChannel(chIndex);
  }

  containerSel.classed('hidden', false);

  function initCanvas(canvasClass, width, sel) {
    sel.classed(canvasClass, true).classed('waveform', true).attr('width', width).attr('height', waveformHeight);
  }

  function renderChannel(chIndex) {
    var currentTransform = Zoom.zoomIdentity;
    let channelData = audioBuffer.getChannelData(chIndex);
    const canvasClass = `waveform-${chIndex}`;

    var canvasSel = establish({
      parentSel: containerSel,
      childTag: 'canvas',
      childSelector: '.' + canvasClass,
      initFn: curry(initCanvas)(canvasClass, width),
    });
    canvasSel.style('display', 'block');
    const height = canvasSel.attr('height');


    if (zoomable) {
      setUpZoom(canvasSel.node(), draw);
    }

    var canvasCtx = canvasSel.node().getContext('2d', { alpha: false });
    canvasCtx.lineWidth = 1;

    draw();

    function draw() {
      drawWaveform({
        canvasSel,
        channelData,
        color: chIndex === 0 ? leftColor : rightColor,
        transform: currentTransform
      });
    }

    function setUpZoom(canvas, draw, initialTransform = undefined) {
      var zoom = Zoom()
        .scaleExtent([1, 8])
        .on('zoom', zoomed);

      var canvasSel = select(canvas);
      canvasSel.call(zoom);

      if (initialTransform) {
        canvasSel.call(zoom.transform, initialTransform);
      }

      function zoomed(zoomEvent) {
        currentTransform = zoomEvent.transform;
        draw(currentTransform);
      }
    }

    function drawWaveform({ channelData, color,transform 
    }) {
      canvasCtx.clearRect(0, 0, width, height);

      var x = scaleLinear().domain([0, channelData.length]).range([0, width]);
      // In canvas, and GUIs in general, remember:
      // +y is down! If we want positive values to be
      // higher than negative ones, we must flip their
      // signs.
      var y = scaleLinear().domain([-1.0, 1.0]).range([height, 0]);
      canvasCtx.beginPath();
      canvasCtx.strokeStyle = color;
      if (transform) {
        canvasCtx.moveTo(0, transform.applyY(y(0)));
      } else {
        canvasCtx.moveTo(0, y(0));
      }
      for (let i = 0; i < channelData.length; ++i) {
        const val = channelData[i];
        let yPos = y(val);
        let xPos = x(i);
        if (transform) {
          yPos = transform.applyY(yPos);
          xPos = transform.applyX(xPos);
        }
        canvasCtx.lineTo(xPos, yPos);
      }
      canvasCtx.stroke();
    }
  }
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
