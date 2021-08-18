import handleError from 'handle-error-web';
import { version } from './package.json';
import { renderSources } from './renderers/render-sources';
import { renderResultAudio } from './index';
import { decodeArrayBuffer } from './tasks/decode-array-buffer';
import { queue } from 'd3-queue';

(async function go() {
  window.onerror = reportTopLevelError;
  renderVersion();

  renderSources({ onBuffers });

  function onBuffers(buffers) {
    if (buffers.length < 1) {
      return;
    }

    var q = queue();
    buffers.forEach((buffer) => q.defer(decodeArrayBuffer, buffer));
    q.awaitAll(useAudioBuffers);
  }

  function useAudioBuffers(error, audioBuffers) {
    if (error) {
      handleError(error);
      return;
    }

    renderResultAudio({
      audioBuffer: audioBuffers[0],
      containerSelector: '.file1-audio',
      onError: handleError,
    });
  }
})();

function reportTopLevelError(msg, url, lineNo, columnNo, error) {
  handleError(error);
}

function renderVersion() {
  var versionInfo = document.getElementById('version-info');
  versionInfo.textContent = version;
}
