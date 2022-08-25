import { ContextMenuMeasurements } from "@ohif/ui";

const defaultContextMenu = {
  id: 'cornerstoneContextMenu',
  type: 'ohif.contextMenu',
  props: {
    show: {
      id: 'show-menu',
      interactionType: 'action',
      commands: [
        {
          commandName: 'showViewerContextMenu',
          commandOptions: {
            menuName: 'cornerstoneContextMenu',
            content: ContextMenuMeasurements,
            items: [
              {
                id: 'forExistingMeasurement',
                selector: ({ nearbyToolData }) => !!nearbyToolData,
                items: [
                  {
                    label: 'Delete measurement',
                    actionType: 'RunCommands',
                    commands: [
                      {
                        commandName: 'deleteMeasurement',
                      }
                    ],
                  },
                  {
                    label: 'Add Label',
                    actionType: 'RunCommands',
                    commands: [
                      {
                        commandName: 'setLabel',
                      },
                    ]
                  },
                ],
              },
            ],
          },
          context: 'CORNERSTONE',
        },
      ],
    },
  },
};

export default defaultContextMenu;
