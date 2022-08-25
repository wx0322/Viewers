import OHIF from '@ohif/core';

import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import {
  init as cs3DInit,
  eventTarget,
  EVENTS,
  metaData,
  volumeLoader,
  imageLoader,
  imageLoadPoolManager,
  Settings,
} from '@cornerstonejs/core';
import { utilities } from '@cornerstonejs/tools';
import {
  cornerstoneStreamingImageVolumeLoader,
  sharedArrayBufferImageLoader,
} from '@cornerstonejs/streaming-image-volume-loader';

import initWADOImageLoader from './initWADOImageLoader';
import initCornerstoneTools from './initCornerstoneTools';

import { connectToolsToMeasurementService } from './initMeasurementService';
import initCineService from './initCineService';
import interleaveCenterLoader from './utils/interleaveCenterLoader';
import interleaveTopToBottom from './utils/interleaveTopToBottom';
import initSegmentationService from './initSegmentationService';
import initContextMenu from './initContextMenu';

// TODO: Cypress tests are currently grabbing this from the window?
window.cornerstone = cornerstone;
window.cornerstoneTools = cornerstoneTools;
/**
 *
 */
export default async function init({
  servicesManager,
  commandsManager,
  configuration,
  appConfig,
}) {
  await cs3DInit();

  // For debugging e2e tests that are failing on CI
  //cornerstone.setUseCPURendering(true);

  // For debugging large datasets
  //cornerstone.cache.setMaxCacheSize(3000000000);

  initCornerstoneTools();

  // Don't use cursors in viewports
  // Todo: this should come from extension/app configuration
  Settings.getRuntimeSettings().set('useCursors', false);

  const {
    UserAuthenticationService,
    ToolGroupService,
    guiCustomizationService,
    CineService,
    CornerstoneViewportService,
    HangingProtocolService,
    SegmentationService,
  } = servicesManager.services;

  const metadataProvider = OHIF.classes.MetadataProvider;

  volumeLoader.registerUnknownVolumeLoader(
    cornerstoneStreamingImageVolumeLoader
  );
  volumeLoader.registerVolumeLoader(
    'cornerstoneStreamingImageVolume',
    cornerstoneStreamingImageVolumeLoader
  );

  HangingProtocolService.registerImageLoadStrategy(
    'interleaveCenter',
    interleaveCenterLoader
  );
  HangingProtocolService.registerImageLoadStrategy(
    'interleaveTopToBottom',
    interleaveTopToBottom
  );

  imageLoader.registerImageLoader(
    'streaming-wadors',
    sharedArrayBufferImageLoader
  );

  metaData.addProvider(metadataProvider.get.bind(metadataProvider), 9999);

  imageLoadPoolManager.maxNumRequests = {
    interaction: appConfig?.maxNumRequests?.interaction || 100,
    thumbnail: appConfig?.maxNumRequests?.thumbnail || 75,
    prefetch: appConfig?.maxNumRequests?.prefetch || 10,
  };

  initWADOImageLoader(UserAuthenticationService, appConfig);

  initSegmentationService(SegmentationService, CornerstoneViewportService);

  initCineService(CineService);

  // When a custom image load is performed, update the relevant viewports
  HangingProtocolService.subscribe(
    HangingProtocolService.EVENTS.CUSTOM_IMAGE_LOAD_PERFORMED,
    volumeInputArrayMap => {
      for (const entry of volumeInputArrayMap.entries()) {
        const [viewportId, volumeInputArray] = entry;
        const viewport = CornerstoneViewportService.getCornerstoneViewport(
          viewportId
        );

        CornerstoneViewportService.setVolumesForViewport(
          viewport,
          volumeInputArray
        );
      }
    }
  );

  initContextMenu({
    CornerstoneViewportService,
    guiCustomizationService,
    commandsManager,
  });

  const newStackCallback = evt => {
    const { element } = evt.detail;
    utilities.stackPrefetch.enable(element);
  };

  function elementEnabledHandler(evt) {
    eventTarget.addEventListener(
      EVENTS.STACK_VIEWPORT_NEW_STACK,
      newStackCallback
    );
  }

  function elementDisabledHandler(evt) {
    const { viewportId } = evt.detail;

    const viewportInfo = CornerstoneViewportService.getViewportInfo(viewportId);
    ToolGroupService.disable(viewportInfo);

    // TODO - consider removing the callback when all elements are gone
    // eventTarget.removeEventListener(
    //   EVENTS.STACK_VIEWPORT_NEW_STACK,
    //   newStackCallback
    // );
  }

  eventTarget.addEventListener(
    EVENTS.ELEMENT_ENABLED,
    elementEnabledHandler.bind(null)
  );

  eventTarget.addEventListener(
    EVENTS.ELEMENT_DISABLED,
    elementDisabledHandler.bind(null)
  );
}

