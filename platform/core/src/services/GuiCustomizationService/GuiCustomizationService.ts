import merge from 'lodash.merge';
import { PubSubService } from '../_shared/pubSubServiceInterface';
import * as Types from '../../Types';

const EVENTS = {
  CUSTOMIZATION_MODIFIED: 'event::guiCustomizationService:modified',
};

export default class GuiCustomizationService extends PubSubService {
  _commandsManager: Types.ICommandsManager;
  extensionManager: Record<string, unknown>;

  modeCustomizations: Record<string, Types.IGuiCustomization> = {};
  globalCustomizations: Record<string, Types.IGuiCustomization> = {};

  constructor(commandsManager) {
    super(EVENTS);
    this._commandsManager = commandsManager;
  }

  init(extensionManager) {
    this.extensionManager = extensionManager;
  }

  reset() {
    super.reset();
    this.modeCustomizations = {};
  }

  /**
   *
   * @param {*} interaction - can be undefined to run nothing
   * @param {*} extraOptions to include in the commands run
   */
  recordInteraction(interaction, extraOptions) {
    if (!interaction) return;
    const commandsManager = this._commandsManager;
    const { commands } = interaction;

    commands.forEach(({ commandName, commandOptions, context }) => {
      if (commandName) {
        commandsManager.runCommand(
          commandName,
          {
            ...commandOptions,
            ...extraOptions,
          },
          context
        );
      }
    });
  }

  getModeCustomizations() {
    return this.modeCustomizations;
  }

  setModeCustomization(id, button) {
    this.modeCustomizations[id] = merge(
      this.modeCustomizations[id] || {},
      button
    );
    this._broadcastEvent(this.EVENTS.CUSTOMIZATION_MODIFIED, {
      buttons: this.modeCustomizations,
      button: this.modeCustomizations[id],
    });
  }

  /** Mode customizations are changes to the behaviour of the extensions
   * when running in a given mode.  Reset clears mode customizations.
   */
  getModeCustomization(id, defaultValue) {
    return this.modeCustomizations[id] ?? defaultValue;
  }

  setModeConfigurations(buttons) {
    this.modeCustomizations = buttons;
    this._broadcastEvent(this.EVENTS.TOOL_BAR_MODIFIED, {
      buttons: this.modeCustomizations,
      buttonSections: this.buttonSections,
    });
  }

  addModeCustomizations(buttons): void {
    if (!buttons) {
      return;
    }
    buttons.forEach(button => {
      if (!this.modeCustomizations[button.id]) {
        this.modeCustomizations[button.id] = button;
      }
    });

    this._broadcastEvent(this.EVENTS.CUSTOMIZATION_MODIFIED, {});
  }

  /** Global customizations are those that affect parts of the GUI other than
   * the modes.  They include things like settings for the search screen.
   * Reset does NOT clear global customizations.
   */
  getGlobalCustomization(
    id: string,
    defaultValue?: Types.IGuiCustomization
  ): Types.IGuiCustomization | void {
    return this.globalCustomizations[id] ?? defaultValue;
  }

  setGlobalCustomization(id: string, value: Types.IGuiCustomization) {
    this.globalCustomizations[id] = value;
  }
}
