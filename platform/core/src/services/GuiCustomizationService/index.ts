import GuiCustomizationService from './GuiCustomizationService';

export default {
  name: 'guiCustomizationService',
  create: ({ configuration = {}, commandsManager }) => {
    return new GuiCustomizationService(commandsManager);
  },
};
