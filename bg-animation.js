import YAML from 'yaml'
import * as sass from 'sass';
const pug = require('./libs/pug.min.js');
var hassConfig, manifestCache, userPluginConfig, galleryRootManifest, packageManifest, processedPackageManifest;

class LovelaceBgAnimation extends HTMLElement {
  set hass(hass) {
    this.initialize()
  }
  async fetchResource(url) {
    try {
      let response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch resource`);
      }
      return await response.text();
    } catch (error) {
      console.error(`Error fetching resource`);
      return null;
    }
  }
  async getGalleryRootManifest() {
    try {
      let url;
      if (userPluginConfig.gallery.type == "local") {
        url = window.location.origin + userPluginConfig.gallery.localPath + "/" + userPluginConfig.gallery.manifestFileName
      } else {
        url = userPluginConfig.gallery.remoteUrl + userPluginConfig.gallery.manifestFileName
      }
      let response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch gallery manifest`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch gallery manifest:', error);
      return null;
    }
  }
  async getPackageManifest(packageManifestName) {
    try {
      let url;
      if (userPluginConfig.gallery.type == "local") {
        url = window.location.origin + userPluginConfig.gallery.localPath + "/" + packageManifestName + "/" + "package.yaml"
      } else {
        url = userPluginConfig.gallery.remoteUrl + "/" + packageManifestName + "/" + "package.yaml"
      }
      let response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch package manifest: ' + packageManifestName);
      }

      return {
        "packageName": packageManifestName,
        "data": await YAML.parse(await response.text())
      };

    } catch (error) {
      console.error('Failed to fetch package manifest: ' + packageManifestName, error);
      return null;
    }
  }
  async processPackageManifest(packageManifestObject) {
    try {
      let environment = {}
      if (userPluginConfig.gallery.type == "local") {
        environment["assetPath"] = window.location.origin + userPluginConfig.gallery.localPath + "/" + packageManifestObject.packageName + "/" + "package.yaml"
      } else {
        environment["assetPath"] = userPluginConfig.gallery.remoteUrl + "/" + packageManifestObject.packageName + "/" + "package.yaml"
      }

      if (packageManifestObject.data.remote_includes) {
        for (const [index, include] of packageManifestObject.data.remote_includes.entries()) {
          packageManifestObject.data.remote_includes[index]["__processed"] = {};
          packageManifestObject.data.remote_includes[index]["__processed"] = await this.fetchResource((include[Object.keys(include)[0]]));
        }
      }
      console.log(pug);

      if (packageManifestObject.data.compile) {
        for (const [index, value] of packageManifestObject.data.compile.entries()) {
          if (value.hasOwnProperty("pug")) {
            console.log("Found pug")
            packageManifestObject.data.compile[index]["__processed"] = pug.render(packageManifestObject.data.compile[index].pug);
          }

          if (value.hasOwnProperty("scss")) {
            packageManifestObject.data.compile[index]["__processed"] = sass.compileString(packageManifestObject.data.compile[index].scss).css;
          }

        }

      } else {
        console.log("Compile does not exist in package.");
      }

      return packageManifestObject;

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
      return item !== null;
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return false;
    }
  }

  async initialize() {

    if (typeof userPluginConfig !== "object") {

      userPluginConfig = this.getCurrentUserConfig();

      galleryRootManifest = await this.getGalleryRootManifest();

      packageManifest = await this.getPackageManifest("1.galaxy-animation");

      processedPackageManifest = await this.processPackageManifest(packageManifest);

      console.log(processedPackageManifest);

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
