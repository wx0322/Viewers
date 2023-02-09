const RESPONSE = {
  NO_NEVER: -1,
  CANCEL: 0,
  CREATE_REPORT: 1,
  ADD_SERIES: 2,
  SET_STUDY_AND_SERIES: 3,
  NO_NOT_FOR_SERIES: 4,
};

function promptTrackNewSeries({ servicesManager, extensionManager }, ctx, evt) {
  const { UIViewportDialogService } = servicesManager.services;
  const { viewportIndex, StudyInstanceUID, SeriesInstanceUID } = evt;

  return new Promise(async function(resolve, reject) {
    let promptResult = await _askShouldAddMeasurements(
      UIViewportDialogService,
      viewportIndex
    );

    if (promptResult === RESPONSE.CREATE_REPORT) {
      promptResult = ctx.isDirty
        ? await _askSaveDiscardOrCancel(UIViewportDialogService, viewportIndex)
        : RESPONSE.SET_STUDY_AND_SERIES;
    }

    resolve({
      userResponse: promptResult,
      StudyInstanceUID,
      SeriesInstanceUID,
      viewportIndex,
      isBackupSave: false,
    });
  });
}

function _askShouldAddMeasurements(UIViewportDialogService, viewportIndex) {
  return new Promise(function(resolve, reject) {
    const message =
      '将该测量添加到已有报告中？';
      // 'Do you want to add this measurement to the existing report?';
    const actions = [
      { type: 'cancel',
      text: '取消',
      // text: 'Cancel',
      value: RESPONSE.CANCEL },
      {
        type: 'secondary',
        text: '创建新报告',
        // text: 'Create new report',
        value: RESPONSE.CREATE_REPORT,
      },
      {
        type: 'primary',
        text: '添加到已有报告中',
        // text: 'Add to existing report',
        value: RESPONSE.ADD_SERIES,
      },
    ];
    const onSubmit = result => {
      UIViewportDialogService.hide();
      resolve(result);
    };

    UIViewportDialogService.show({
      viewportIndex,
      type: 'info',
      message,
      actions,
      onSubmit,
      onOutsideClick: () => {
        UIViewportDialogService.hide();
        resolve(RESPONSE.CANCEL);
      },
    });
  });
}

function _askSaveDiscardOrCancel(UIViewportDialogService, viewportIndex) {
  return new Promise(function(resolve, reject) {
    const message =
      '已存在追踪的测量值，是否对其进行操作？';
      // 'You have existing tracked measurements. What would you like to do with your existing tracked measurements?';
    const actions = [
      { type: 'cancel',
      text: '取消',
      // text: 'Cancel',
       value: RESPONSE.CANCEL },
      {
        type: 'secondary',
        text: '保存',
        // text: 'Save',
        value: RESPONSE.CREATE_REPORT,
      },
      {
        type: 'primary',
        text: '丢弃',
        // text: 'Discard',
        value: RESPONSE.SET_STUDY_AND_SERIES,
      },
    ];
    const onSubmit = result => {
      UIViewportDialogService.hide();
      resolve(result);
    };

    UIViewportDialogService.show({
      viewportIndex,
      type: 'warning',
      message,
      actions,
      onSubmit,
      onOutsideClick: () => {
        UIViewportDialogService.hide();
        resolve(RESPONSE.CANCEL);
      },
    });
  });
}

export default promptTrackNewSeries;
