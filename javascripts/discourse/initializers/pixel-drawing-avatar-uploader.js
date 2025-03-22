import { action } from "@ember/object";
import { withPluginApi } from "discourse/lib/plugin-api";
import AvatarSelectorModal from "../components/avatar-selector";

export default {
  name: "pixel-drawing-avatar-uploader",

  initialize() {
    withPluginApi("0.8", (api) => {
      //to use our AvatarSelectorModal to use our AvatarUploader to use PixelDrawingModal
      api.modifyClass(
        "route:preferences-account",
        (Superclass) =>
          class extends Superclass {
            @action
            showAvatarSelector(user) {
              this.modal.show(AvatarSelectorModal, {
                model: { user },
              });
            }
          }
      );
    });
  },
};
