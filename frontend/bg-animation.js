import YAML from 'yaml'
import * as sass from 'sass';

var lovelaceUI = {},
  rootPluginConfig,
  galleryRootManifest,
  packageManifest,
  processedPackageManifest,
  applicationIdentifiers = { "appNameShort": "lovelace-bg-animation", "rootFolderName": "lovelace-bg-animation", "scriptName": ["bg-animation.min.js", "bg-animation.js"] }, memoryCache = {};

async function getGalleryRootManifest() {
  try {
    let checkCacheGalleryManifest = retrieveCache("HASSanimatedBg_galleryRootManifest");
    if (checkCacheGalleryManifest && rootPluginConfig.cache === true) {
      return checkCacheGalleryManifest;
    } else {

      let url;
      if (rootPluginConfig.gallery.type == "local") {
        url = window.location.origin + lovelaceUI.pluginInstallPath + "/gallery/" + rootPluginConfig.gallery.manifestFileName
      } else {
        url = rootPluginConfig.gallery.remoteRootUrl + "/gallery/" + rootPluginConfig.gallery.manifestFileName
      }

      let response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to fetch gallery manifest`);
      }

      let responseJson = await response.json();

      if (rootPluginConfig.cache === true) {
        storeCache("HASSanimatedBg_galleryRootManifest", responseJson)
      }

      return responseJson

    }

  } catch (error) {
    console.error('Failed to fetch gallery manifest:', error);
    return null;
  }
}

async function getPackageManifest(packageManifestIndex) {
  try {

    let packageManifestName = rootPluginConfig.background[packageManifestIndex].id;
    let packageCacheKey = btoa(packageManifestName + Object.entries(rootPluginConfig.background[packageManifestIndex].parameters).map(([key, value]) => `${key}:${value}`).join(' '));
    let checkCachePackageManifest = retrieveCache("HASSanimatedBg_packageRaw__" + packageCacheKey);

    if (checkCachePackageManifest && rootPluginConfig.background[packageManifestIndex].cache === true && rootPluginConfig.cache === true) {
      return checkCachePackageManifest;
    } else {
      let url;
      if (rootPluginConfig.gallery.type == "local") {
        url = window.location.origin + lovelaceUI.pluginInstallPath + "/gallery/packages/" + packageManifestName + "/" + "package.yaml"
      } else {
        url = rootPluginConfig.gallery.remoteRootUrl + "/gallery/packages/" + packageManifestName + "/" + "package.yaml"
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

      if (rootPluginConfig.background[packageManifestIndex].cache === true && rootPluginConfig.cache === true) {
        storeCache("HASSanimatedBg_packageRaw__" + packageCacheKey, packageManifest);
      }

      return packageManifest;
    }
  } catch (error) {
    console.error('Failed to fetch package manifest: ' + packageManifestIndex, error);
    return null;
  }
}

async function processPackageManifest(packageManifestObject) {

  try {

    let packageManifestIndex = packageManifestObject.packageIndex;
    let packageManifestName = rootPluginConfig.background[packageManifestObject.packageIndex].id;
    let packageCacheKey = btoa(packageManifestName + Object.entries(rootPluginConfig.background[packageManifestIndex].parameters).map(([key, value]) => `${key}:${value}`).join(' '));
    let checkCachePackageManifest = retrieveCache("HASSanimatedBg_packageProcessed__" + packageCacheKey);

    if (checkCachePackageManifest && rootPluginConfig.background[packageManifestIndex].cache === true && rootPluginConfig.cache === true) {
      return checkCachePackageManifest;
    } else {
      let environment = {}
      if (rootPluginConfig.gallery.type == "local") {
        environment["basePath"] = window.location.origin + lovelaceUI.pluginInstallPath + "/gallery/packages/" + packageManifestObject.packageName + "/"
      } else {
        environment["basePath"] = rootPluginConfig.gallery.remoteRootUrl + "/gallery/packages/" + packageManifestObject.packageName + "/"
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
              return rootPluginConfig.background[packageManifestIndex].parameters[key] ? rootPluginConfig.background[packageManifestIndex].parameters[key] : packageManifestObject.data.parameters.find(item => item.id == key)?.default || match;
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

      if (rootPluginConfig.background[packageManifestIndex].cache === true && rootPluginConfig.cache === true) {
        storeCache("HASSanimatedBg_packageProcessed__" + packageCacheKey, packageManifestObject);
      }

      return packageManifestObject;

    }

  } catch (error) {
    console.error('Failed to process the package manifest: ' + packageManifestObject, error);
    return null;
  }
}

function retrieveCache(cacheKey) {
  try {
    const item = localStorage.getItem(cacheKey);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return null;
  }
}

function storeCache(cacheKey, data) {
  try {
    localStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (error) {
    console.error('Error storing data in localStorage:', error);
  }
}

function opportunisticallyDetermineLocalInstallPath() {
  try {
    if (memoryCache.installPath == undefined) {
      if (!memoryCache.scriptTags) {
        memoryCache.scriptTags = Array.from(document.querySelectorAll('script[src]')).find(script =>
          script.src.includes('lovelace-bg-animation') ||
          applicationIdentifiers.scriptName.some(name => script.src.includes(name))
        );
      }
      let src = memoryCache.scriptTags.src.replace(window.location.origin, '');
      applicationIdentifiers.scriptName.forEach(key => src = src.replace(key, ''));
      let itemsToRemove = ['/dist/', '/dist', 'dist'];
      memoryCache.installPath = itemsToRemove.reduce((acc, item) => acc.replace(item, ''), src);
    }
    return memoryCache.installPath;
  } catch (error) {
    console.error('Error in opportunisticallyDetermineLocalInstallPath:', error);
    return null;
  }
}

function initializeRuntimeVariables() {
  lovelaceUI.panelElement = document.querySelector("body > home-assistant")?.shadowRoot?.querySelector("home-assistant-main")?.shadowRoot?.querySelector("ha-drawer > partial-panel-resolver > ha-panel-lovelace");
  lovelaceUI.huiRootElement = lovelaceUI.panelElement?.shadowRoot?.querySelector("hui-root");
  lovelaceUI.headerElement = lovelaceUI.huiRootElement?.shadowRoot?.querySelector("div > div.header");
  lovelaceUI.viewElement = lovelaceUI.huiRootElement?.shadowRoot?.querySelector("#view");
  lovelaceUI.huiViewElement = lovelaceUI.viewElement?.querySelector("hui-view");
  lovelaceUI.groundElement = lovelaceUI.huiRootElement?.shadowRoot?.querySelector("div");
  lovelaceUI.lovelaceObject = lovelaceUI.huiRootElement?.lovelace;
  rootPluginConfig = lovelaceUI.lovelaceObject.config["bg-animation"]
  rootPluginConfig = {
    "gallery": {
      "type": rootPluginConfig.gallery?.type ?? "remote",
      "localRootPath": rootPluginConfig.gallery?.localRootPath ?? "/local/lovelace-bg-animation",
      "manifestFileName": rootPluginConfig.gallery?.manifestFileName ?? "gallery.manifest",
      "remoteRootUrl": rootPluginConfig.gallery?.remoteRootUrl ?? "https://ibz0q.github.io/lovelace-bg-animation"
    },
    "delay": rootPluginConfig.delay ?? 0,
    "transition": rootPluginConfig.transition ?? false,
    "cache": rootPluginConfig.cache !== undefined ? rootPluginConfig.cache : true,
    "style": rootPluginConfig.style ?? "position: fixed; right: 0; top: 0; min-width: 100vw; min-height: 100vh; z-index: -10;",
    "header": rootPluginConfig.header ?? { "transparent": true, "style": "" },
    "background": rootPluginConfig.background
      ? Object.keys(rootPluginConfig.background).reduce((acc, key) => {
        acc[key] = {
          ...rootPluginConfig.background[key],
          style: rootPluginConfig.background[key]?.style ?? 'min-width: 100vw; min-height: 100vh; border:0; overflow: hidden;',
          cache: rootPluginConfig.background[key]?.cache !== undefined ? rootPluginConfig.background[key].cache : true,
          delay: rootPluginConfig.background[key]?.delay ?? 50000,
          redraw: rootPluginConfig.background[key]?.redraw ?? 0
        };
        return acc;
      }, [])
      : false,
    "sequence": rootPluginConfig.sequence ?? "random"
  }

  lovelaceUI.pluginInstallPath = (() => {
    if (rootPluginConfig.gallery?.localRootPath) {
      return rootPluginConfig.gallery.localRootPath;
    } else if (opportunisticallyDetermineLocalInstallPath()) {
      return opportunisticallyDetermineLocalInstallPath();
    } else {
      return rootPluginConfig.gallery.localRootPath;
    }
  })();
}

function initializePluginElements() {
  let bgRootContainer = document.createElement("div");
  bgRootContainer.id = "bg-animation-container";
  bgRootContainer.style.cssText = rootPluginConfig.style;
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

function changeDefaultLovelaceStyles() {
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

  if (rootPluginConfig.header.transparent == true) {
    cssStyle += `

        .header {
          background: transparent !important;
          ${rootPluginConfig.header.style !== undefined ? rootPluginConfig.header.style : ''}
        }`;
  }

  lovelaceUI.rootStyleElement.innerHTML = cssStyle;
}

function processBackgroundFrame(packageObject) {
  lovelaceUI.iframeElement.style.cssText = rootPluginConfig.background[packageObject.packageIndex].style;
  lovelaceUI.iframeElement.srcdoc = packageObject.data.template__processed;
}

async function initialize() {
  if (rootPluginConfig == undefined) {
    initializeRuntimeVariables()
    changeDefaultLovelaceStyles()
    initializePluginElements()
    galleryRootManifest = await getGalleryRootManifest();

    if (rootPluginConfig.background) {

      for (const [index, background] of rootPluginConfig.background.entries()) {
        if (!galleryRootManifest.some(manifest => manifest.id === background.id)) {
          console.error(`Background id ${background.id} does not exist in galleryRootManifest`);
          break;
        }

        packageManifest = await getPackageManifest(index);
        processedPackageManifest = await processPackageManifest(packageManifest);
      }

      if (processedPackageManifest !== "undefined") {
        processBackgroundFrame(processedPackageManifest)
      }

    }

  }
}

initialize();

class LovelaceBgAnimation extends HTMLElement {
  constructor() {
    super(); 
    this.styles = `
      @import url('${lovelaceUI.pluginInstallPath}/frontend/css/fontawesome.min.css');
      @import url('${lovelaceUI.pluginInstallPath}/frontend/css/regular.min.css');
      @import url('${lovelaceUI.pluginInstallPath}/frontend/css/solid.min.css');
    `;
  }

  connectedCallback() {
    const styleElement = document.createElement('style');
    styleElement.textContent = this.styles;
    document.head.appendChild(styleElement);
  }

  static get properties() {
    return {
      hass: {},
      config: {}
    }
  }

  set hass(hass) {
    if (rootPluginConfig !== undefined) {
      if (!this.content) {
        this.innerHTML = `
          <style>
            ${this.styles}
          </style>
          <ha-card header="Example-card">
              <div class="card-content">
                <i class="fa-solid fa-user"></i>
                <!-- uses solid style -->
                <i class="fa-brands fa-github-square"></i>
              </div>
          </ha-card>
      `;
        this.content = this.querySelector("div");
        console.log("set inner hass called");
      }
    }
  }

  setConfig(config) {
    this.config = config;
  }

  getCardSize() {
    return 1;
  }
}

customElements.define('lovelace-bg-animation', LovelaceBgAnimation);
