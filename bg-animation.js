import YAML from 'yaml'

let defaults = {
  "galleryType": "local",
  "galleryLocation": "gallery",
  "galleryManifestFileName": "gallery.manifest"
};

class LovelaceBgAnimation extends HTMLElement {
  set hass(hass) {

    this.initialize()

  }
  initialize() {

    console.log("wwwwwwwwwwwwwwwwwwww");

  }
  setConfig(config) {
    this.config = config;
    if (this.content) {
      delete this.content;
      this.initialize()
    }
  }
  getCardSize() {
    return 0;
  }
}
customElements.define('lovelace-bg-animation', LovelaceBgAnimation);