import YAML from 'yaml'
import * as sass from 'sass';
const pug = require('./libs/pug.min.js');
var hassConfig, manifestCache, pluginUserConfig, galleryManifest, packageManifest;

class LovelaceBgAnimation extends HTMLElement {
  set hass(hass) {
    this.initialize()
  }
  async getGalleryManifest() {
    try {
      let url;
      if (pluginUserConfig.gallery.type == "local") {
        url = window.location.origin + pluginUserConfig.gallery.localPath + "/" + pluginUserConfig.gallery.manifestFileName
      } else {
        url = pluginUserConfig.gallery.remoteUrl + pluginUserConfig.gallery.manifestFileName
      }
      let response = await fetch(url); // Fetching the file from the URL
      if (!response.ok) {
        throw new Error(`Failed to fetch gallery manifest`);
      }
      return await response.json(); // Assuming the manifest is in JSON format, adjust as needed
    } catch (error) {
      console.error('Failed to fetch gallery manifest:', error);
      return null;
    }
  }
  async getPackageManifest(packageName) {
    try {
      let url;
      if (pluginUserConfig.gallery.type == "local") {
        url = window.location.origin + pluginUserConfig.gallery.localPath + "/" + packageName + "/" + "package.yaml"
      } else {
        url = pluginUserConfig.gallery.remoteUrl + "/" + packageName + "/" + "package.yaml"
      }
      let response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch package manifest: ' + packageName);
      }
      return await YAML.parse(await response.text());
    } catch (error) {
      console.error('Failed to fetch package manifest: ' + packageName, error);
      return null;
    }
  }
  async processPackageManifest(packageObject) {
    try {

      //   metadata:
      //   name: Galaxy Animated
      //   description: A slow moving animation of the galaxy with stars
      //   author: Rahul
      //   source: https://codepen.io/stack-findover/pen/eYWPwPV

// first remote includes
// then complile
// then template = includes, compile, params

      if (packageObject.compile) {
        packageObject.compile.forEach(function (item) {

          console.log(item.id); 
          console.log(item.pug); 
          console.log(item.scss); 


        });

      } else {
        console.log("Compile does not exist in package.");
      }

      // parameters:
      //   background-image: xxx

      // remote_includes: 
      //   jquery: "url"

      // compile:
      //   - id: pug_1
      //     pug: |
      //       .container

      //   - id: scss_1
      //     scss: |
      //       * {

      // template: |
      //   <style>
      //     {{compile: scss_1}}
      //   </style>
      //   <body>
      //       {{compile: pug_1}}
      //   </body>

      packageObject = await YAML.parse(await response.text());



      // return {...packageObject, ...processedPackageObject};
    } catch (error) {
      console.error('Failed to process the package manifest: ', error);
      return null;
    }
  }
  getCurrentUserConfig() {
    return {
      "gallery": {
        "type": this.config.gallery.type || "remote",
        "localPath": this.config.gallery.localPath || "/local/lovelace-bg-animation/gallery",
        "manifestFileName": this.config.gallery.manifestFileName || "gallery.manifest",
        "remoteUrl": this.config.gallery.remoteUrl || "https://ibz0q.github.io/lovelace-bg-animation/gallery"
      },
      "delay": this.config.delay || false,
      "redraw": this.config.redraw || false,
      "cache": this.config.cache || true,
      "sequence": this.config.sequence || "random"
    }
  }

  checkIfContentInCache(packageUid) {
    try {
      const item = localStorage.getItem(packageUid);
      return item !== null; // Returns true if the item exists in localStorage, false otherwise
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return false;
    }
  }

  async initialize() {

    if (typeof pluginUserConfig !== "object") {

      pluginUserConfig = this.getCurrentUserConfig();


      galleryManifest = await this.getGalleryManifest();
      packageManifest = await this.getPackageManifest("1.galaxy-animation");

      // let processedPackageManifest = await this.processPackageManifest(packageManifest);

      console.log(packageManifest);

    }


  }
  setConfig(config) {
    this.config = config;
    // if (this.content) {
    //   delete this.content;
    //   this.initialize()
    // }
  }
  getCardSize() {
    return 0;
  }
}
customElements.define('lovelace-bg-animation', LovelaceBgAnimation);


// Read from local folder, manifest
// Validate that folder exist
// If errors write a black page

/* maybe?
*/

// Cache output of compiled shit
