import ContextMenuItemsBuilder from './ContextMenuItemsBuilder';
import { ContextMenuMeasurements } from '@ohif/ui';

const getDefaultPosition = () => {
  return {
    x: 0,
    y: 0,
  };
};
const _getEventDefaultPosition = eventDetail => ({
  x: eventDetail && eventDetail.currentPoints.client[0],
  y: eventDetail && eventDetail.currentPoints.client[1],
});

const _getViewerElementDefaultPosition = viewerElement => {
  if (viewerElement) {
    const boundingClientRect = viewerElement.getBoundingClientRect();
    return {
      x: boundingClientRect.x,
      y: boundingClientRect.y,
    };
  }

  return {
    x: undefined,
    y: undefined,
  };
};

const _getCanvasPointsPosition = (points = [], viewerElementOfReference) => {
  const viewerPos = _getViewerElementDefaultPosition(viewerElementOfReference);

  for (let pointIndex = 0; pointIndex < points.length; pointIndex++) {
    const point = {
      x: points[pointIndex][0] || points[pointIndex]['x'],
      y: points[pointIndex][1] || points[pointIndex]['y'],
    };
    if (_isValidPosition(point) && _isValidPosition(viewerPos)) {
      return {
        x: point.x + viewerPos.x,
        y: point.y + viewerPos.y,
      };
    }
  }
};

const _isValidPosition = source => {
  return source && typeof source.x === 'number' && typeof source.y === 'number';
};
/**
 * Returns the context menu default position. It look for the positions of: canvasPoints (got from selected), event that triggers it, current viewport element
 */
const _getDefaultPosition = (canvasPoints, eventDetail, viewerElement) => {
  function* getPositionIterator() {
    yield _getCanvasPointsPosition(canvasPoints, viewerElement);
    yield _getEventDefaultPosition(eventDetail);
    yield _getViewerElementDefaultPosition(viewerElement);
    yield getDefaultPosition();
  }

  const positionIterator = getPositionIterator();

  let current = positionIterator.next();
  let position = current.value;

  while (!current.done) {
    position = current.value;

    if (_isValidPosition(position)) {
      positionIterator.return();
    }
    current = positionIterator.next();
  }

  return position;
};

export class ViewerContextMenuController {
  commandsManager: Record<string, unknown>;
  services: Record<string, unknown>;

  constructor(servicesManager, commandsManager) {
    this.services = servicesManager.services;
    this.commandsManager = commandsManager;
  }

  /**
   * Finds tool nearby event position triggered.
   *
   * @param {Object} commandsManager mannager of commands
   * @param {Object} event that has being triggered
   * @returns cs toolData or undefined if not found.
   */
  findNearbyToolData(commandsManager, event = {}) {
    if (!event.detail) {
      return;
    }
    const { element, currentPoints } = event.detail;
    return commandsManager.runCommand('getNearbyToolData', {
      element,
      canvasCoordinates: currentPoints?.canvas,
    });
  }

  closeViewerContextMenu() {
    this.services.UIDialogService.dismiss({ id: 'context-menu' });
  }

  showViewerContextMenu(
    contextMenuProps,
    activeViewerElement,
    defaultPointsPosition
  ) {
    if (!this.services.UIDialogService) {
      console.warn('Unable to show dialog; no UI Dialog Service available.');
      return;
    }

    const { event, subMenu, menuId, nearbyToolData, items, refs, } = contextMenuProps;
    const _nearbyToolData =
      nearbyToolData || this.findNearbyToolData(this.commandsManager, event);

    const onGetMenuItems = (menus, refs, props) => {
      // TODO - add display set and image metadata
      // nearbyToolData is included both by name and value
      // because the value version of it is used as the generic value copy,
      // whereas the nearbyToolData is used by selector functions
      return new ContextMenuItemsBuilder().getMenuItems(
        {
          toolName: _nearbyToolData?.metadata?.toolName,
          value: _nearbyToolData,
          nearbyToolData: _nearbyToolData,
        },
        event,
        menus,
        refs,
        props,
        menuId
      );
    };

    this.services.UIDialogService.dismiss({ id: 'context-menu' });
    this.services.UIDialogService.create({
      id: 'context-menu',
      isDraggable: false,
      preservePosition: false,
      preventCutOf: true,
      defaultPosition: _getDefaultPosition(
        defaultPointsPosition,
        event?.detail,
        activeViewerElement
      ),
      event,
      content: ContextMenuMeasurements,

      onClickOutside: () =>
        this.services.UIDialogService.dismiss({ id: 'context-menu' }),

      contentProps: {
        items,
        onGetMenuItems,
        event,
        subMenu,
        eventData: event?.detail,
        refs,
        onRunCommands: item => {
          const { commands } = item;
          const { annotationUID: uid } = item.value;

          commands.forEach(command =>
            this.commandsManager.runCommand(command.commandName,
              {
                ...command.commandOptions, uid, refs,
              },
              command.context));
        },

        onClose: () => {
          this.services.UIDialogService.dismiss({ id: 'context-menu' });
        },

        /**
         * Displays a sub-menu, removing this menu
         * @param {*} item
         * @param {*} itemRef
         * @param {*} subProps
         */
        onSubMenu: (item, itemRef, subProps) => {
          if (!itemRef.subMenu) {
            console.warn('No submenu defined for', item, itemRef, subProps);
            return;
          }
          this.showViewerContextMenu(
            {
              ...contextMenuProps,
              menuId: itemRef.subMenu,
            },
            activeViewerElement,
            defaultPointsPosition
          );
        },

        onDefault: (item, itemRef, subProps) => {
          const { commandName, commandOptions, context } = itemRef;
          const { annotationUID: uid } = item.value;

          if (!commandName) {
            return;
          }

          this.commandsManager.runCommand(commandName,
            {
              ...itemRef,
              ...commandOptions,
              uid,
              refs,
            },
            context);
        },
      },
    });
  }
}
