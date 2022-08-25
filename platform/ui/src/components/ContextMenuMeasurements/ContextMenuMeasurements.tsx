import { ContextMenu } from '../';
import PropTypes from 'prop-types';
import React from 'react';


const imageAreaMenus = [
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
];

const ContextMenuMeasurements = ({ onGetMenuItems, refs = {}, items = imageAreaMenus, ...props }) => {
  const menuItems = onGetMenuItems(
    items,
    refs,
    props
  );

  if (!menuItems) {
    return null;
  }

  return <ContextMenu items={menuItems} />;
};

ContextMenuMeasurements.propTypes = {
  onClose: PropTypes.func.isRequired,
  onRunCommands: PropTypes.func.isRequired,
  onGetMenuItems: PropTypes.func.isRequired,
};

export default ContextMenuMeasurements;
