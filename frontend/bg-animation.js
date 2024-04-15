import YAML from 'yaml'
import * as sass from 'sass';

var lovelaceUI = {},
  rootPluginConfig,
  galleryRootManifest,
  domObserver = {},
  currentPlaylistIndex = 0,
  nextPlaylistIndex = 0,
  applicationIdentifiers = { "appNameShort": "lovelace-bg-animation", "rootFolderName": "lovelace-bg-animation", "scriptName": ["bg-animation.min.js", "bg-animation.js"] }, memoryCache = {};

function sortArray(array, method) {
  switch (method) {
    case 'random':
      return (function (array) {
        for (let i = array.length - 1; i > 0; i--) {
          let j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      })(array);
    case 'reverse':
      return array.reverse();
    case 'id_asc':
      return (function (array) {
        return array.sort((a, b) => a.id - b.id);
      })(array);
    case 'id_desc':
      return (function (array) {
        return array.sort((a, b) => b.id - a.id);
      })(array);
    default:
      console.error('Invalid sorting method');
      return array;
  }
}

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

      galleryRootManifest = responseJson
    }

  } catch (error) {
    console.error('Failed to fetch gallery manifest:', error);
    return null;
  }
}

async function getPackageManifest(packageConfig) {
  try {
    let packageManifestId = packageConfig.id;
    let packageCacheKey = btoa(packageManifestId + Object.entries(packageConfig.parameters).map(([key, value]) => `${key}:${value}`).join(' '));
    let checkCachePackageManifest = retrieveCache("HASSanimatedBg_packageRaw__" + packageCacheKey);

    if (checkCachePackageManifest && packageConfig.cache === true && rootPluginConfig.cache === true) {
      return checkCachePackageManifest;
    } else {
      let url;
      if (rootPluginConfig.gallery.type == "local") {
        url = window.location.origin + lovelaceUI.pluginInstallPath + "/gallery/packages/" + packageManifestId + "/" + "package.yaml"
      } else {
        url = rootPluginConfig.gallery.remoteRootUrl + "/gallery/packages/" + packageManifestId + "/" + "package.yaml"
      }

      let response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        throw new Error('Failed to fetch package manifest: ' + packageManifestId);
      }
      let packageManifest = await YAML.parse(await response.text());

      if (packageConfig.cache === true && rootPluginConfig.cache === true) {
        storeCache("HASSanimatedBg_packageRaw__" + packageCacheKey, packageManifest);
      }

      return packageManifest;
    }
  } catch (error) {
    console.error('Failed to fetch package manifest: ' + packageManifestId, error);
    return null;
  }
}

async function processPackageManifest(packageConfig, packageManifest) {
  try {
    let packageManifestName = packageConfig.id;
    let packageCacheKey = btoa(packageManifestName + Object.entries(packageConfig.parameters).map(([key, value]) => `${key}:${value}`).join(' '));
    let checkCachePackageManifest = retrieveCache("HASSanimatedBg_packageProcessed__" + packageCacheKey);

    if (checkCachePackageManifest && packageConfig.cache === true && rootPluginConfig.cache === true) {
      return checkCachePackageManifest;
    } else {
      let environment = {}
      if (rootPluginConfig.gallery.type == "local") {
        environment["basePath"] = window.location.origin + lovelaceUI.pluginInstallPath + "/gallery/packages/" + packageManifestName + "/"
      } else {
        environment["basePath"] = rootPluginConfig.gallery.remoteRootUrl + "/gallery/packages/" + packageManifestName + "/"
      }

      if (packageManifest.remote_includes) {
        for (const [index, include] of packageManifest.remote_includes.entries()) {
          packageManifest.remote_includes[index]["__processed"] = {};
          packageManifest.remote_includes[index]["__processed"] = await fetch(include.url, { cache: "no-store" });
        }
      }

      if (packageManifest.compile) {
        for (const [index, value] of packageManifest.compile.entries()) {
          if (value.hasOwnProperty("scss")) {
            packageManifest.compile[index]["__processed"] = sass.compileString(packageManifest.compile[index].scss).css;
          }
        }
      }

      if (typeof window !== 'undefined') {
        if (packageManifest?.helpers?.insert_baseurl == true) {
          let insert_baseurl = '<base href="' + environment["basePath"] + '" target="_blank">';
          if (packageManifest.template.includes('<head>')) {
            packageManifest.template = packageManifest.template.replace(/(?<=<head>)/, `\n${insert_baseurl}`);
          } else if (packageManifest.template.includes('<html>')) {
            packageManifest.template = packageManifest.template.replace(/(?<=<html>)/, `\n${insert_baseurl}`);
          }
        }
      }

      if (packageManifest.template) {
        packageManifest.template__processed = packageManifest.template
        const regex = /\{\{(compile|parameter|parameters|param|metadata|meta|environment|env|remote_includes):(.*?)\}\}/g;
        packageManifest.template__processed = packageManifest.template__processed.replace(regex, function (match, type, key) {
          key = key.trim();
          switch (type) {
            case 'compile':
              return packageManifest.compile.find(item => item.id === key)?.__processed || '';
            case 'parameters':
            case 'parameter':
            case 'param':
              return packageConfig.parameters[key] ? packageConfig.parameters[key] : packageManifest.parameters.find(item => item.id == key)?.default || match;
            case 'metadata':
            case 'meta':
              return packageManifest.metadata?.[key] || match;
            case 'environment':
            case 'env':
              return environment[key] || match;
            case 'remote_includes':
              if (Array.isArray(packageManifest.remote_includes)) {
                const include = packageManifest.remote_includes.find(item => item.id === key);
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

      if (packageConfig.cache === true && rootPluginConfig.cache === true) {
        storeCache("HASSanimatedBg_packageProcessed__" + packageCacheKey, packageManifest);
      }

      return packageManifest;
    }

  } catch (error) {
    console.error('Failed to process the package manifest: ' + packageManifest, error);
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
    "duration": rootPluginConfig.duration ?? 50000,
    "transition": rootPluginConfig.transition ?? false,
    "cache": rootPluginConfig.cache !== undefined ? rootPluginConfig.cache : true,
    "style": rootPluginConfig.style ?? "position: fixed; right: 0; top: 0; min-width: 100vw; min-height: 100vh; z-index: -10;",
    "header": rootPluginConfig.header ?? { "transparent": true, "style": "" },
    "background": {
      "global":
        rootPluginConfig.background.global
          ? rootPluginConfig.background.global.map(item => ({
            ...item,
            style: item?.style ?? 'min-width: 100vw; min-height: 100vh; border:0; overflow: hidden;',
            cache: item?.cache !== undefined ? item.cache : true,
            duration: item?.duration ?? false,
            redraw: item?.redraw ?? 0
          }))
          : false,
      "view": rootPluginConfig.background.view
        ? Object.keys(rootPluginConfig.background.view).reduce((acc, key) => {
          acc[key] = rootPluginConfig.background.view[key].map(viewItem => ({
            ...viewItem,
            style: viewItem?.style ?? 'min-width: 100vw; min-height: 100vh; border:0; overflow: hidden;',
            cache: viewItem?.cache !== undefined ? viewItem.cache : true,
            duration: viewItem?.duration ?? false,
            redraw: viewItem?.redraw ?? 0
          }));
          return acc;
        }, {})
        : false
    },
    "sort": ["random", "reverse", "id_asc", "id_desc"].includes(rootPluginConfig?.sort) ? rootPluginConfig.sort : "random"
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

function processBackgroundFrame(packageConfig, packageManifest) {
  lovelaceUI.iframeElement.style.cssText = packageConfig.style;
  lovelaceUI.iframeElement.srcdoc = packageManifest.template__processed;
}

function getCurrentViewPath() {
  return window.location.pathname.split('/')[2];
}

async function startPlaylistInterval(currentPlaylist) {
  let duration = currentPlaylist[currentPlaylistIndex]?.duration ? currentPlaylist[currentPlaylistIndex].duration : rootPluginConfig.duration;
  let packageManifest = await getPackageManifest(currentPlaylist[currentPlaylistIndex]);
  let processedPackageManifest = await processPackageManifest(currentPlaylist[currentPlaylistIndex], packageManifest);
  processBackgroundFrame(currentPlaylist[currentPlaylistIndex], processedPackageManifest);

  document.dispatchEvent(new CustomEvent('mediaUpdate', { detail: { message: { "packageConfig": currentPlaylist[currentPlaylistIndex], "packageManifest": processedPackageManifest } } }));

  nextPlaylistIndex = (currentPlaylistIndex + 1) % currentPlaylist.length;
  if (nextPlaylistIndex == currentPlaylistIndex) {
    console.log("Playlist only has one item, skipping interval.")
    return;
  }

  if (window.__global_minterval) {
    clearTimeout(window.__global_minterval);
  }

  currentPlaylistIndex = nextPlaylistIndex;

  window.__global_minterval = setTimeout(() => {
    startPlaylistInterval(currentPlaylist)
  }, duration);

}

async function setupPlaylist() {
  let viewPath = getCurrentViewPath();
  if (rootPluginConfig.background.view[viewPath] || rootPluginConfig.background.global) {

    //Check if the view has a background defined, if not use the global one
    let currentPlaylist = sortArray(rootPluginConfig?.background?.view[viewPath] ? rootPluginConfig?.background?.view[viewPath] : rootPluginConfig?.background?.global, rootPluginConfig.sort);

    //Check if all package ID's exist in the manifest
    let allIdsExist = true;
    currentPlaylist.forEach(slide => {
      if (!galleryRootManifest.some(manifest => manifest.id === slide.id)) {
        console.error(`Slide id ${slide.id} does not exist in the manifest.`);
        allIdsExist = false
      }
    });
    if (!allIdsExist) {
      console.error("Some package ID's do not exist, unable to continue.");
      return;
    }

    //Set the current index to 0
    currentPlaylistIndex = 0;

    if (window.__global_minterval) {
      clearTimeout(window.__global_minterval);
    }

    startPlaylistInterval(currentPlaylist);

  } else {
    console.error("No backgrounds found in the user config.")
  }
}

async function cardMediaControls(control) {
  let currentPlaylist = rootPluginConfig.background.view[getCurrentViewPath()] ? rootPluginConfig.background.view[getCurrentViewPath()] : rootPluginConfig.background.global;
  switch (control) {
    case 'back':
      currentPlaylistIndex = currentPlaylistIndex - 1 < 0 ? currentPlaylist.length - 1 : currentPlaylistIndex - 1;
      break;
    case 'forward':
      currentPlaylistIndex = (currentPlaylistIndex + 1) % currentPlaylist.length;
      break;
    case 'play':
      startPlaylistInterval(currentPlaylist);
      break;
    case 'pause':
      if (window.__global_minterval) {
        clearTimeout(window.__global_minterval);
      }
      break;
    default:
      console.error("Invalid control button.");
      break;
  }
}

async function initializeObservers() {
  domObserver.viewElement = new MutationObserver((mutations) => {
    mutations.forEach(function (mutation) {
      if (mutation.addedNodes.length > 0) {
        console.log("Observed change in view")
        console.log(getCurrentViewPath())
        setupPlaylist()
      }
    });
  });
  domObserver.viewElement.observe(lovelaceUI.viewElement, {
    characterData: false,
    childList: true,
    subtree: false,
    characterDataOldValue: false
  });
}

if (rootPluginConfig == undefined) {
  initializeRuntimeVariables()
  changeDefaultLovelaceStyles()
  initializePluginElements()
  await getGalleryRootManifest();
}
await initializeObservers();
await setupPlaylist();

class LovelaceBgAnimation extends HTMLElement {
  constructor() {
    super();
    this.styles = `
      @import url('${lovelaceUI.pluginInstallPath}/frontend/css/fontawesome.min.css');
      @import url('${lovelaceUI.pluginInstallPath}/frontend/css/regular.min.css');
      @import url('${lovelaceUI.pluginInstallPath}/frontend/css/solid.min.css');
      @font-face {
        font-family: 'Chivo Mono';
        font-style: normal;
        font-weight: 500;
        src: local('Chivo Mono'), url('${lovelaceUI.pluginInstallPath}/frontend/webfonts/ChivoMono[wght].woff') format('woff');
    }
    @font-face {
        font-family: 'Chivo Mono';
        font-style: italic;
        font-weight: 500;
        src: local('Chivo Mono'), url('${lovelaceUI.pluginInstallPath}/frontend/webfonts/ChivoMono-Italic[wght].woff') format('woff');
    }
      `;
  }

  static get properties() {
    return {
      hass: {},
      config: {}
    }
  }

  connectedCallback() {
    const styleElement = document.getElementById('lovelace-bg-animation-rootStyle');
    if (!styleElement) {
      const newStyleElement = document.createElement('style');
      newStyleElement.id = 'lovelace-bg-animation-rootStyle';
      newStyleElement.textContent = this.styles;
      document.head.appendChild(newStyleElement);
    }
  }

  set hass(hass) {
    if (rootPluginConfig !== undefined) {
      if (!this.content) {
        console.log(lovelaceUI.lovelaceObject)
        this.innerHTML = `
            <link rel="stylesheet" href="${lovelaceUI.pluginInstallPath}/frontend/css/card.css">
            <style>
              ${this.styles}
              .media-player {
                display: flex;
                align-items: center;
                justify-content: space-between;
                width: 100%;
              }
              .control-button {
                background: none;
                border: none;
                cursor: pointer;
                font-size: 20px;
                margin-right: 10px; 
              }
              .control-button:last-child {
                margin-right: 0; 
              }
              .media-name-container {
                flex-grow: 1;
                text-align: center;
                overflow: hidden;
                white-space: nowrap; 
              }
              .media-ticker {
                display: inline-block;
                font-family: 'Chivo Mono', sans-serif;
                padding-left: 100%;
                animation: ticker 20s steps(150) infinite; 
                text-transform: capitalize;
              }
              @keyframes ticker {
                0% { transform: translate3d(0, 0, 0); }
                100% { transform: translate3d(-100%, 0, 0); }
              }
              span.soft {
                opacity: 0.4; /* Make the text 70% opaque, or 30% lighter */
              }
            </style>
            <ha-card>
              <div class="card-content">
                <div class="media-player">
                  <button class="control-button" id="back-button">
                    <i class="fas fa-backward"></i>
                  </button>
                  <button class="control-button" id="play-pause-button">
                    <i class="fas fa-play"></i>
                  </button>
                  <div class="media-name-container">
                    <div class="media-ticker">
                      <span class="name"></span> 
                      <span class="description"></span> 
                      <span class="author"></span>  
                    </div>
                  </div>
                  <button class="control-button" id="forward-button">
                    <i class="fas fa-forward"></i>
                  </button>
                </div>
              </div>
            </ha-card>
      `;

        this.content = this.querySelector("div");
        this.content.querySelectorAll('.control-button').forEach(button => {
          button.addEventListener('click', () => {
            cardMediaControls(button.id);
          });
        });

        document.addEventListener('mediaUpdate', (e) => {
          let packageConfig = e.detail.message.packageConfig;
          let packageManifest = e.detail.message.packageManifest;
          let mediaName = packageManifest.metadata?.name ?? packageConfig.id;
          let mediaDescription = packageManifest.metadata?.description ?? "No description available.";
          let mediaAuthor = packageManifest.metadata?.author ?? "Unknown";
          this.content.querySelector('.name').innerHTML = `<span class="soft">Playing:</span>: ${mediaName}`;
          this.content.querySelector('.description').innerHTML = `<span class="soft">Description:</span> ${mediaDescription}`;
          this.content.querySelector('.author').innerHTML = `<span class="soft">Author:</span> ${mediaAuthor}`;
        });

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
