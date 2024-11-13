import { action } from "@ember/object";
import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "pixel-drawing-avatar-uploader",

  initialize() {
    withPluginApi("0.8", (api) => {
      api.modifyClass("component:avatar-uploader", {
        pluginId: "pixel-drawing-avatar-uploader",
        @action
        async save(dataURL) {
          const res = await fetch(dataURL);
          const buf = await res.arrayBuffer();
          const file = new File([buf], "avatar-drawing.png", {
            type: "image/png",
          });
          await this.uppyUpload.addFiles(file);
        },
      });
    });
  },
};
