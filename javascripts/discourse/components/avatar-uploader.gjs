//duplicated from app/assets/javascripts/discourse/app/components/avatar-uploader.gjs
//to use PixelDrawingModal instead of chooseImage and file <input>

import { tracked } from "@glimmer/tracking";
import Component from "@ember/component";
import { fn } from "@ember/helper";
import { action } from "@ember/object";
import { getOwner } from "@ember/owner";
//import didInsert from "@ember/render-modifiers/modifiers/did-insert";
import { isBlank } from "@ember/utils";
import { tagName } from "@ember-decorators/component";
import DButton from "discourse/components/d-button";
import discourseComputed from "discourse/lib/decorators";
import UppyUpload from "discourse/lib/uppy/uppy-upload";
import { i18n } from "discourse-i18n";
import PixelDrawingModal from "./pixel-drawing-modal";

@tagName("span")
export default class AvatarUploader extends Component {
  @tracked modalIsVisible; // added

  uppyUpload = new UppyUpload(getOwner(this), {
    id: "avatar-uploader",
    type: "avatar",
    validateUploadedFilesOptions: {
      imagesOnly: true,
    },
    uploadDone: (upload) => {
      this.setProperties({
        imageIsNotASquare: upload.width !== upload.height,
        uploadedAvatarTemplate: upload.url,
        uploadedAvatarId: upload.id,
      });

      this.done();
    },
    additionalParams: () => ({
      user_id: this.user_id,
    }),
    autoStartUploads: false, // added
  });

  imageIsNotASquare = false;

  @discourseComputed("uppyUpload.uploading", "uploadedAvatarId")
  customAvatarUploaded() {
    return !this.uppyUpload.uploading && !isBlank(this.uploadedAvatarId);
  }

  @discourseComputed("uppyUpload.uploading", "uppyUpload.uploadProgress")
  uploadLabel() {
    return this.uppyUpload.uploading
      ? `${i18n("uploading")} ${this.uppyUpload.uploadProgress}%`
      : i18n("upload");
  }

  @action
  chooseImage() {
    this.uppyUpload.openPicker();
  }

  @action
  async save(dataURL) {
    this.uppyUpload.setup();
    const res = await fetch(dataURL);
    const buf = await res.arrayBuffer();
    const file = new File([buf], "avatar-drawing.png", {
      type: "image/png",
    });
    await this.uppyUpload.addFiles(file);
    await this.uppyUpload.startUpload();
  }

  <template>
    {{!--
    <input
      {{didInsert this.uppyUpload.setup}}
      class="hidden-upload-field"
      disabled={{this.uploading}}
      type="file"
      accept="image/*"
      aria-hidden="true"
    />
    --}}
    <DButton
      @translatedLabel="Draw"
      @icon="far-image"
      @disabled={{this.uploading}}
      @action={{fn (mut this.modalIsVisible) true}}
      @title="user.change_avatar.upload_title"
      class="btn-default avatar-uploader__button"
      data-uploaded={{this.customAvatarUploaded}}
      data-avatar-upload-id={{this.uploadedAvatarId}}
    />

    {{#if this.modalIsVisible}}
      <PixelDrawingModal
        @save={{this.save}}
        @closeModal={{fn (mut this.modalIsVisible) false}}
      />
    {{/if}}

    {{#if this.imageIsNotASquare}}
      <div class="warning">{{i18n
          "user.change_avatar.image_is_not_a_square"
        }}</div>
    {{/if}}
  </template>
}
