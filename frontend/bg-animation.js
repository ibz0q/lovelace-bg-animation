import YAML from 'yaml'
import * as sass from 'sass';

var hassConfig,
  lovelaceUI = {},
  userPluginConfig,
  galleryRootManifest,
  packageManifest,
  processedPackageManifest,
  applicationIdentifiers = { "appNameShort": "lovelace-bg-animation", "installFolderName": "lovelace-bg-animation", "scriptName": ["bg-animation.min.js", "bg-animation.js"] }

class LovelaceBgAnimation extends HTMLElement {
  set hass(hass) {
    hassConfig = hass;
    this.initialize()
  }

  async getGalleryRootManifest() {
    try {

      let checkCacheGalleryManifest = this.retrieveCache("HASSanimatedBg_galleryRootManifest");

      if (checkCacheGalleryManifest && userPluginConfig.cache === true) {
        return checkCacheGalleryManifest;
      } else {

        let url;

        if (userPluginConfig.gallery.type == "local") {
          url = window.location.origin + userPluginConfig.gallery.localRootPath + "/gallery/" + userPluginConfig.gallery.manifestFileName
        } else {
          url = userPluginConfig.gallery.remoteRootUrl + "/gallery/" + userPluginConfig.gallery.manifestFileName
        }

        let response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to fetch gallery manifest`);
        }

        let responseJson = await response.json();

        if (userPluginConfig.cache === true) {
          this.storeCache("HASSanimatedBg_galleryRootManifest", responseJson)
        }

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
          url = window.location.origin + userPluginConfig.gallery.localRootPath + "/gallery/packages/" + packageManifestName + "/" + "package.yaml"
        } else {
          url = userPluginConfig.gallery.remoteRootUrl + "/gallery/packages/" + packageManifestName + "/" + "package.yaml"
        }

        let response = await fetch(url, { cache: "no-store" });
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
          environment["basePath"] = window.location.origin + userPluginConfig.gallery.localRootPath + "/gallery/packages/" + packageManifestObject.packageName + "/"
        } else {
          environment["basePath"] = userPluginConfig.gallery.remoteRootUrl + "/gallery/packages/" + packageManifestObject.packageName + "/"
        }

        if (packageManifestObject.data.remote_includes) {
          for (const [index, include] of packageManifestObject.data.remote_includes.entries()) {
            packageManifestObject.data.remote_includes[index]["__processed"] = {};
            packageManifestObject.data.remote_includes[index]["__processed"] = await fetch(include.url, { cache: "no-store" });
          }
        }

        if (packageManifestObject.data.compile) {
          for (const [index, value] of packageManifestObject.data.compile.entries()) {
            if (value.hasOwnProperty("scss")) {
              packageManifestObject.data.compile[index]["__processed"] = sass.compileString(packageManifestObject.data.compile[index].scss).css;
            }
          }
        }

        if (typeof window !== 'undefined') {
          if (packageManifestObject.data?.helpers?.insert_baseurl == true) {
            let insert_baseurl = '<base href="' + environment["basePath"] + '" target="_blank">';
            if (packageManifestObject.data.template.includes('<head>')) {
              packageManifestObject.data.template = packageManifestObject.data.template.replace(/(?<=<head>)/, `\n${insert_baseurl}`);
            } else if (packageManifestObject.data.template.includes('<html>')) {
              packageManifestObject.data.template = packageManifestObject.data.template.replace(/(?<=<html>)/, `\n${insert_baseurl}`);
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
    userPluginConfig = {
      "gallery": {
        "type": this.config.gallery?.type ?? "remote",
        "localRootPath": this.config.gallery?.localRootPath ?? "/local/lovelace-bg-animation",
        "manifestFileName": this.config.gallery?.manifestFileName ?? "gallery.manifest",
        "remoteRootUrl": this.config.gallery?.remoteRootUrl ?? "https://ibz0q.github.io/lovelace-bg-animation"
      },
      "delay": this.config.delay ?? 0,
      "transition": this.config.transition ?? false,
      "cache": this.config.cache !== undefined ? this.config.cache : true,
      "style": this.config.style ?? "position: fixed; right: 0; top: 0; min-width: 100vw; min-height: 100vh; z-index: -10;",
      "header": this.config.header ?? { "transparent": true, "style": "" },
      "background": this.config.background
        ? Object.keys(this.config.background).reduce((acc, key) => {
          acc[key] = {
            ...this.config.background[key],
            style: this.config.background[key]?.style ?? 'min-width: 100vw; min-height: 100vh; border:0; overflow: hidden;',
            cache: this.config.background[key]?.cache !== undefined ? this.config.background[key].cache : true,
            delay: this.config.background[key]?.delay ?? 50000,
            redraw: this.config.background[key]?.redraw ?? 0
          };
          return acc;
        }, [])
        : false,
      "sequence": this.config.sequence ?? "random"
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
  opportunisticallyDetermineInstallPath() {
    try {
      const scriptTags = document.querySelectorAll('script[src]');
      const firstTag = Array.from(scriptTags).find(script =>
        script.src.includes('lovelace-bg-animation') ||
        applicationIdentifiers.scriptName.some(name => script.src.includes(name))
      );
      console.log("print");
      console.log(firstTag[0]);
      if (firstTag[0]) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error in opportunisticallyDetermineInstallPath:', error);
      return null;
    }
  }

  initializeRuntimeVariables() {
    lovelaceUI.panelElement = document.querySelector("body > home-assistant")?.shadowRoot?.querySelector("home-assistant-main")?.shadowRoot?.querySelector("ha-drawer > partial-panel-resolver > ha-panel-lovelace");
    lovelaceUI.huiRootElement = lovelaceUI.panelElement?.shadowRoot?.querySelector("hui-root");
    lovelaceUI.headerElement = lovelaceUI.huiRootElement?.shadowRoot?.querySelector("div > div.header");
    lovelaceUI.viewElement = lovelaceUI.huiRootElement?.shadowRoot?.querySelector("#view");
    lovelaceUI.huiViewElement = lovelaceUI.viewElement?.querySelector("hui-view");
    lovelaceUI.groundElement = lovelaceUI.huiRootElement?.shadowRoot?.querySelector("div");
    lovelaceUI.lovelaceObject = lovelaceUI.huiRootElement?.lovelace;
    lovelaceUI.installDirectory = (() => {
      if (this.config.gallery?.localRootPath) {
        console.log("went with user define")
        return this.config.gallery.localRootPath;
      } else if (this.opportunisticallyDetermineInstallPath() === true) {
        console.log("went opportunisticallyDetermineInstallPath")

        return this.opportunisticallyDetermineInstallPath();
      } else {
        console.log("went with default")

        return userPluginConfig.gallery.localRootPath;
      }
    })();
    console.log(lovelaceUI)
  }

  initializePluginElements() {
    let bgRootContainer = document.createElement("div");
    bgRootContainer.id = "bg-animation-container";
    bgRootContainer.style.cssText = userPluginConfig.style;
    lovelaceUI.groundElement.prepend(bgRootContainer);
    lovelaceUI.bgRootElement = bgRootContainer;
    if (lovelaceUI.iframeElement == undefined) {
      lovelaceUI.iframeElement = document.createElement('iframe');
      lovelaceUI.iframeElement.id = `background-iframe`;
      lovelaceUI.iframeElement.frameborder = "0";
      lovelaceUI.iframeElement.scrolling = "no";
      lovelaceUI.iframeElement.srcdoc = "<style>*{background:black;}</style>";
      lovelaceUI.iframeElement.style.cssText = "opacity: 0;";
      lovelaceUI.iframeElement.className = applicationIdentifiers.appNameShort;
      lovelaceUI.bgRootElement.appendChild(lovelaceUI.iframeElement);
    }
  }

  changeDefaultLovelaceStyles() {
    lovelaceUI.rootStyleElement = lovelaceUI.huiRootElement.shadowRoot.querySelector("#bg-animation-styles");
    if (!lovelaceUI.rootStyleElement) {
      lovelaceUI.rootStyleElement = document.createElement("style");
      lovelaceUI.rootStyleElement.id = "bg-animation-styles";
      lovelaceUI.huiRootElement.shadowRoot.prepend(lovelaceUI.rootStyleElement);
    }

    let cssStyle = `
        #view > hui-view, #view {
          background: transparent !important;
        }`;

    if (userPluginConfig.header.transparent == true) {
      cssStyle += `

        .header {
          background: transparent !important;
          ${userPluginConfig.header.style !== undefined ? userPluginConfig.header.style : ''}
        }`;
    }

    lovelaceUI.rootStyleElement.innerHTML = cssStyle;
  }

  processBackgroundFrame(packageObject) {
    lovelaceUI.iframeElement.style.cssText = userPluginConfig.background[packageObject.packageIndex].style;
    lovelaceUI.iframeElement.srcdoc = packageObject.data.template__processed;
  }

  async initialize() {

    if (typeof userPluginConfig == "undefined") {

      this.getCurrentUserConfig();
      this.initializeRuntimeVariables()
      this.changeDefaultLovelaceStyles()
      this.initializePluginElements()

      galleryRootManifest = await this.getGalleryRootManifest();

      if (userPluginConfig.background) {

        for (const [index, background] of userPluginConfig.background.entries()) {
          if (!galleryRootManifest.some(manifest => manifest.id === background.id)) {
            console.error(`Background id ${background.id} does not exist in galleryRootManifest`);
            break;
          }

          packageManifest = await this.getPackageManifest(index);
          processedPackageManifest = await this.processPackageManifest(packageManifest);
        }

        if (processedPackageManifest !== "undefined") {
          this.processBackgroundFrame(processedPackageManifest)
        }

      }

    }
  }

  setConfig(config) {
    this.config = config;
    //  if (this.content) {
    //    delete this.content;
    //    this.initialize()
    //  }
  }
  getCardSize() {
    return 0;
  }
}
customElements.define('lovelace-bg-animation', LovelaceBgAnimation);
