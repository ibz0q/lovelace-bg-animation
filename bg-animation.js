import YAML from 'yaml'
import * as sass from 'sass';

var appName = "BG Animation", appNameShort = "lovelace-bg-animation"
var hassConfig, lovelaceUI = {}, userPluginConfig, galleryRootManifest, packageManifest, processedPackageManifest, debugPrefix = `${appName} DEBUG: `

class LovelaceBgAnimation extends HTMLElement {
  set hass(hass) {
    hassConfig = hass;
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

      let checkCacheGalleryManifest = this.retrieveCache("HASSanimatedBg_galleryRootManifest");

      if (checkCacheGalleryManifest && userPluginConfig.cache === true) {

        return checkCacheGalleryManifest;

      } else {

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

        let responseJson = await response.json();

        this.storeCache("HASSanimatedBg_galleryRootManifest", responseJson)

        return responseJson

      }

    } catch (error) {
      console.error('Failed to fetch gallery manifest:', error);
      return null;
    }
  }

  async getPackageManifest(packageManifestIndex) {
    try {

      let packageManifestName = userPluginConfig.background[packageManifestIndex].id;

      let packageCacheKey = btoa(packageManifestName + Object.entries(userPluginConfig.background[packageManifestIndex].parameters).map(([key, value]) => `${key}:${value}`).join(' '));

      let checkCachePackageManifest = this.retrieveCache("HASSanimatedBg_packageRaw__" + packageCacheKey);

      if (checkCachePackageManifest && userPluginConfig.background[packageManifestIndex].cache === true && userPluginConfig.cache === true) {

        return checkCachePackageManifest;

      } else {
        let url;
        if (userPluginConfig.gallery.type == "local") {
          url = window.location.origin + userPluginConfig.gallery.localPath + "/" + packageManifestName + "/" + "package.yaml"
        } else {
          url = userPluginConfig.gallery.remoteUrl + "/" + packageManifestName + "/" + "package.yaml"
        }

        console.log(url);

        let response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch package manifest: ' + packageManifestName);
        }
        const packageManifest = {
          "packageIndex": packageManifestIndex,
          "packageName": packageManifestName,
          "data": await YAML.parse(await response.text())
        };

        if (userPluginConfig.background[packageManifestIndex].cache === true && userPluginConfig.cache === true) {
          this.storeCache("HASSanimatedBg_packageRaw__" + packageCacheKey, packageManifest);
        }

        return packageManifest;
      }
    } catch (error) {
      console.error('Failed to fetch package manifest: ' + packageManifestIndex, error);
      return null;
    }
  }

  async processPackageManifest(packageManifestObject) {

    try {

      let packageManifestIndex = packageManifestObject.packageIndex;
      let packageManifestName = userPluginConfig.background[packageManifestObject.packageIndex].id;
      let packageCacheKey = btoa(packageManifestName + Object.entries(userPluginConfig.background[packageManifestIndex].parameters).map(([key, value]) => `${key}:${value}`).join(' '));
      let checkCachePackageManifest = this.retrieveCache("HASSanimatedBg_packageProcessed__" + packageCacheKey);

      if (checkCachePackageManifest && userPluginConfig.background[packageManifestIndex].cache === true && userPluginConfig.cache === true) {
        return checkCachePackageManifest;
      } else {
        let environment = {}
        if (userPluginConfig.gallery.type == "local") {
          environment["assetPath"] = window.location.origin + userPluginConfig.gallery.localPath + "/" + packageManifestObject.packageName + "/" + "package.yaml"
        } else {
          environment["assetPath"] = userPluginConfig.gallery.remoteUrl + "/" + packageManifestObject.packageName + "/" + "package.yaml"
        }

        if (packageManifestObject.data.remote_includes) {
          for (const [index, include] of packageManifestObject.data.remote_includes.entries()) {
            packageManifestObject.data.remote_includes[index]["__processed"] = {};
            packageManifestObject.data.remote_includes[index]["__processed"] = await this.fetchResource((include.url));
          }
        }

        if (packageManifestObject.data.compile) {

          for (const [index, value] of packageManifestObject.data.compile.entries()) {

            if (value.hasOwnProperty("scss")) {
              packageManifestObject.data.compile[index]["__processed"] = sass.compileString(packageManifestObject.data.compile[index].scss).css;
            }

          }

        }

        if (packageManifestObject.data.template) {

          packageManifestObject.data.template__processed = packageManifestObject.data.template

          const regex = /\{\{(compile|parameter|parameters|param|metadata|meta|environment|env|remote_includes):(.*?)\}\}/g;

          packageManifestObject.data.template__processed = packageManifestObject.data.template__processed.replace(regex, function (match, type, key) {

            key = key.trim();
            switch (type) {
              case 'compile':
                return packageManifestObject.data.compile.find(item => item.id === key)?.__processed || '';
              case 'parameters':
              case 'parameter':
              case 'param':
                return userPluginConfig.background[packageManifestIndex].parameters[key] ? userPluginConfig.background[packageManifestIndex].parameters[key] : packageManifestObject.data.parameters.find(item => item.id == key)?.default || match;
              case 'metadata':
              case 'meta':
                return packageManifestObject.data.metadata?.[key] || match;
              case 'environment':
              case 'env':
                return environment[key] || match;
              case 'remote_includes':
                if (Array.isArray(packageManifestObject.data.remote_includes)) {
                  const include = packageManifestObject.data.remote_includes.find(item => item.id === key);
                  return include?.__processed || match;
                }
                return match;

              default:
                return match;
            }

          });

        } else {
          console.error("Template does not exist in package, it is required.");
        }

        if (userPluginConfig.background[packageManifestIndex].cache === true && userPluginConfig.cache === true) {
          this.storeCache("HASSanimatedBg_packageProcessed__" + packageCacheKey, packageManifestObject);
        }

        return packageManifestObject;

      }

    } catch (error) {
      console.error('Failed to process the package manifest: ' + packageManifestObject, error);
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
      "delay": this.config.delay || 0,
      "redraw": this.config.redraw || 0,
      "cache": this.config.cache !== undefined ? this.config.cache : true,
      "style": this.config.style || "position: fixed; right: 0; top: 0; min-width: 100vw; min-height: 100vh; z-index: -10;",
      "background": this.config.background
        ? Object.keys(this.config.background).reduce((acc, key) => {
          acc[key] = {
            ...this.config.background[key],
            style: this.config.background[key].style || 'min-width: 100vw; min-height: 100vh;',
            cache: this.config.background[key].cache !== undefined ? this.config.background[key].cache : true,
            delay: this.config.background[key].delay || 50000
          };
          return acc;
        }, [])
        : false,
      "sequence": this.config.sequence || "random"
    }
  }

  retrieveCache(cacheKey) {
    try {
      const item = localStorage.getItem(cacheKey);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  }

  storeCache(cacheKey, data) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error storing data in localStorage:', error);
    }
  }

  initializeLovelaceVariables() {
    lovelaceUI.panelElement = document.querySelector("body > home-assistant").shadowRoot.querySelector("home-assistant-main").shadowRoot.querySelector("ha-drawer > partial-panel-resolver > ha-panel-lovelace")
    lovelaceUI.huiRootElement = lovelaceUI.panelElement.shadowRoot.querySelector("hui-root")
    lovelaceUI.viewElement = lovelaceUI.huiRootElement.shadowRoot.querySelector("#view")
    lovelaceUI.huiViewElement = lovelaceUI.viewElement.querySelector("hui-view")
    lovelaceUI.groundElement = lovelaceUI.huiRootElement.shadowRoot.querySelector("div")
    lovelaceUI.lovelaceObject = lovelaceUI.huiRootElement.lovelace
  }

  initializeBackground() {
    console.log(lovelaceUI)
    let bgRootContainer = document.createElement("div");
    bgRootContainer.id = "bg-animation-container";
    bgRootContainer.style.cssText = userPluginConfig.style;
    lovelaceUI.groundElement.prepend(bgRootContainer);
    lovelaceUI.bgRootElement = bgRootContainer;
  }

  removeDefaultBackground() {
    let cssStyle;
    cssStyle = window.getComputedStyle(lovelaceUI.huiViewElement);
    if (cssStyle.background !== 'transparent') {
      lovelaceUI.huiViewElement.style.background = 'transparent';
    }
    if (cssStyle.background !== 'transparent') {
      lovelaceUI.viewElement.style.background = 'transparent';
    }
  }

  writeBackgroundElement(packageObject) {
    let iframe = document.createElement('iframe');
    iframe.id = `background-iframe-${packageObject.packageIndex}`;
    iframe.className = appNameShort;
    iframe.frameborder = "0";
    iframe.style.cssText = userPluginConfig.background[packageObject.packageIndex].style;
    iframe.srcdoc = packageObject.data.template__processed;
    lovelaceUI.bgRootElement.appendChild(iframe);
  }

  async initialize() {

    if (typeof userPluginConfig == "undefined") {

      userPluginConfig = this.getCurrentUserConfig();

      this.initializeLovelaceVariables()
      this.initializeBackground()
      this.removeDefaultBackground()
      galleryRootManifest = await this.getGalleryRootManifest();

      if (userPluginConfig.background) {

        for (const [index, background] of userPluginConfig.background.entries()) {
          if (!galleryRootManifest.some(manifest => manifest.id === background.id)) {
            console.error(`Background id ${background.id} does not exist in galleryRootManifest`);
            break;
          }
          console.log(userPluginConfig)

          packageManifest = await this.getPackageManifest(index);
          processedPackageManifest = await this.processPackageManifest(packageManifest);
        }

        if (processedPackageManifest !== "undefined") {
          this.writeBackgroundElement(processedPackageManifest)
        }

      }

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
