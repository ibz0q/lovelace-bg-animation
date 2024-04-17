import YAML from 'yaml'
import * as sass from 'sass';

var lovelaceUI = {},
  rootPluginConfig,
  galleryRootManifest,
  domObserver = {},
  processedPackageManifests = {},
  uiWriteDelay,
  playlistIndexes = { "global": { "current": 0, "next": 0 }, "view": { "current": 0, "next": 0 } },
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
        url = window.location.origin + lovelaceUI.pluginAssetPath + "/gallery/" + rootPluginConfig.gallery.manifestFileName
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
    let packageCacheKey = btoa(packageManifestId + Object.entries(packageConfig.parameters || { 0: "none" }).map(([key, value]) => `${key}:${value}`).join(' '));
    let checkCachePackageManifest = retrieveCache("HASSanimatedBg_packageRaw__" + packageCacheKey);
    if (checkCachePackageManifest && packageConfig.cache === true && rootPluginConfig.cache === true) {
      return checkCachePackageManifest;
    } else {
      let url;
      if (rootPluginConfig.gallery.type == "local") {
        url = window.location.origin + lovelaceUI.pluginAssetPath + "/gallery/packages/" + packageManifestId + "/" + "package.yaml"
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
    let packageCacheKey = btoa(packageManifestName + Object.entries(packageConfig.parameters || { 0: "none" }).map(([key, value]) => `${key}:${value}`).join(' '));
    let checkCachePackageManifest = retrieveCache("HASSanimatedBg_packageProcessed__" + packageCacheKey);
    if (checkCachePackageManifest && packageConfig.cache === true && rootPluginConfig.cache === true) {
      return checkCachePackageManifest;
    } else {
      let environment = {}
      if (rootPluginConfig.gallery.type == "local") {
        environment["basePath"] = window.location.origin + lovelaceUI.pluginAssetPath + "/gallery/packages/" + packageManifestName + "/"
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
             return (packageConfig.parameters && packageConfig.parameters[key]) ? packageConfig.parameters[key] : packageManifest.parameters.find(item => item.id == key)?.default || match;
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
      memoryCache.installPath = ['/dist/', '/dist', 'dist'].reduce((acc, item) => acc.replace(item, ''), src);
    }
    return memoryCache.installPath;
  } catch (error) {
    return null;
  }
}
function initializeRuntimeVariables() {

  if (!lovelaceUI?.lovelaceObject?.config["bg-animation"]) {
    console.error("No bg-animation config found in lovelace configuration.")
    return false;
  }

  rootPluginConfig = lovelaceUI?.lovelaceObject?.config["bg-animation"]
  rootPluginConfig = {
    "gallery": {
      "type": rootPluginConfig.gallery?.type ?? "remote",
      "localRootPath": rootPluginConfig.gallery?.localRootPath ?? "/local/lovelace-bg-animation",
      "manifestFileName": rootPluginConfig.gallery?.manifestFileName ?? "gallery.manifest",
      "remoteRootUrl": rootPluginConfig.gallery?.remoteRootUrl ?? "https://ibz0q.github.io/lovelace-bg-animation"
    },
    "overlay": {
      "show": rootPluginConfig.overlay?.show ?? true,
      "style": rootPluginConfig.overlay?.style ?? "",
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
            redraw: item?.redraw ?? 0,
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
        : false,
    },
    "sort": ["random", "reverse", "id_asc", "id_desc"].includes(rootPluginConfig?.sort) ? rootPluginConfig.sort : "random"
  }

  lovelaceUI.pluginAssetPath = (() => {
    if (rootPluginConfig.gallery?.type == "local") {
      if (rootPluginConfig.gallery?.localRootPath) {
        return rootPluginConfig.gallery.localRootPath;
      } else if (opportunisticallyDetermineLocalInstallPath()) {
        return opportunisticallyDetermineLocalInstallPath();
      } else {
        return rootPluginConfig.gallery.localRootPath;
      }
    } else {
      return rootPluginConfig.gallery.remoteRootUrl;
    }
  })();
}

function initializeLovelaceVariables() {
  try {
    lovelaceUI = {}
    lovelaceUI.haMainElement = document.querySelector("body > home-assistant")?.shadowRoot?.querySelector("home-assistant-main")?.shadowRoot;
    lovelaceUI.panelElement = lovelaceUI.haMainElement?.querySelector("ha-drawer > partial-panel-resolver > ha-panel-lovelace")?.shadowRoot;
    lovelaceUI.huiRootElement = lovelaceUI.panelElement?.querySelector("hui-root");
    lovelaceUI.headerElement = lovelaceUI.huiRootElement?.shadowRoot?.querySelector("div > div.header");
    lovelaceUI.viewElement = lovelaceUI.huiRootElement?.shadowRoot?.querySelector("#view");
    lovelaceUI.huiViewElement = lovelaceUI.viewElement?.querySelector("hui-view");
    lovelaceUI.groundElement = lovelaceUI.huiRootElement?.shadowRoot?.querySelector("div");
    lovelaceUI.lovelaceObject = lovelaceUI.huiRootElement?.lovelace;
    if (!lovelaceUI.lovelaceObject) {
      return false;
    }
    return true;

  } catch (error) {
    console.error('Error in initializeRuntimeVariables:', error);
    return false;
  }
}

function initializeBackgroundElements() {
  lovelaceUI.bgRootElement = document.createElement("div");
  lovelaceUI.bgRootElement.id = "bg-animation-container";
  lovelaceUI.bgRootElement.style.cssText = rootPluginConfig.style;
  lovelaceUI.groundElement.prepend(lovelaceUI.bgRootElement);

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
  if (rootPluginConfig.overlay?.show) {
    lovelaceUI.bgRootElement.insertAdjacentHTML('beforeend', `<div id="bg-overlay" ${rootPluginConfig.overlay.style ? `style="${rootPluginConfig.overlay.style}"` : ''}></div>`);
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

function getPlaylistIndex() {
  return playlistIndexes[rootPluginConfig?.background?.view[getCurrentViewPath()] ? "view" : "global"];
}

async function startPlaylistInterval(currentPlaylist) {
  let playlistIndex = getPlaylistIndex();
  let currentPlaylistTrack = currentPlaylist[playlistIndex.next]
  let duration = currentPlaylistTrack?.duration ? currentPlaylistTrack.duration : rootPluginConfig.duration;
  let packageManifest = await getPackageManifest(currentPlaylistTrack);
  let processedPackageManifest = await processPackageManifest(currentPlaylistTrack, packageManifest);
  processedPackageManifests[currentPlaylistTrack.id] = processedPackageManifest;
  processBackgroundFrame(currentPlaylistTrack, processedPackageManifest);

  document.dispatchEvent(new CustomEvent('mediaUpdate', { detail: { message: { "packageConfig": currentPlaylistTrack, "packageManifest": processedPackageManifest } } }));

  playlistIndex.current = playlistIndex.next;
  playlistIndex.next = (playlistIndex.next + 1) % currentPlaylist.length;

  if (playlistIndex.current == playlistIndex.next) {
    console.log("Playlist only has one item, skipping interval.")
    return;
  }

  if (window.__global_minterval) {
    clearTimeout(window.__global_minterval);
  }

  window.__global_minterval = setTimeout(() => {
    startPlaylistInterval(currentPlaylist)
  }, duration)

}

async function setupPlaylist() {
  let viewPath = getCurrentViewPath();
  if (rootPluginConfig.background.view[viewPath] || rootPluginConfig.background.global) {

    let currentPlaylist = sortArray(rootPluginConfig?.background?.view[viewPath] ? rootPluginConfig?.background?.view[viewPath] : rootPluginConfig?.background?.global, rootPluginConfig.sort);
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

    if (window.__global_minterval) {
      clearTimeout(window.__global_minterval);
    }

    startPlaylistInterval(currentPlaylist);

  } else {
    console.error("No backgrounds found in the user config.")
  }
}

async function initializeObservers() {
  if (domObserver.haMainElement) {
    domObserver.haMainElement.disconnect();
  }

  domObserver.haMainElement = new MutationObserver((mutations) => {
    mutations.forEach(function (mutation) {
      if (mutation.addedNodes.length > 0) {
        uiWriteDelay = setTimeout(() => {
          initialize();
        }, 200);
      }
    });
  });

  domObserver.haMainElement.observe(lovelaceUI.haMainElement, {
    characterData: true,
    childList: true,
    subtree: true,
    characterDataOldValue: true
  });

  if (domObserver.viewElement) {
    domObserver.viewElement.disconnect();
  }

  domObserver.viewElement = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
      if (mutation.removedNodes) {
        mutation.removedNodes.forEach(async (removedNode) => {
          console.log("viewElement observer")
          await getGalleryRootManifest();
          await setupPlaylist();

          if (removedNode === lovelaceUI.viewElement) {
            console.log('lovelaceUI.viewElement has been removed');
            observer.disconnect();
          }

        });
      }
    }

  });


  domObserver.viewElement.observe(lovelaceUI.viewElement, {
    characterData: true,
    childList: true,
    subtree: true,
    characterDataOldValue: true
  });

  if (domObserver.panelElement) {
    domObserver.panelElement.disconnect();
  }

  domObserver.panelElement = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.removedNodes.length > 0) {
        if (mutation.removedNodes[0].nodeName.toLowerCase() == "hui-editor") {
          uiWriteDelay = setTimeout(() => {
            initialize();
          }, 200);
        }
      }
    });
  });

  domObserver.panelElement.observe(lovelaceUI.panelElement, {
    characterData: true,
    childList: true,
    subtree: true,
    characterDataOldValue: true
  });

  if (domObserver.huiRootElement) {
    domObserver.huiRootElement.disconnect();
  }

  domObserver.huiRootElement = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.addedNodes.length > 0) {
        console.log("panelElement huiRootElement")
      }
    });
  });

  domObserver.huiRootElement.observe(lovelaceUI.huiRootElement, {
    characterData: true,
    childList: true,
    subtree: true,
    characterDataOldValue: true
  });
}

async function initialize() {
  let initializeLovelaceVars = initializeLovelaceVariables()
  if (initializeLovelaceVars == true) {
    await initializeObservers();
  } else {
    console.log("Failed to initialize lovelace variables from this view.")
  }

  if (initializeLovelaceVars == true && lovelaceUI.lovelaceObject.config["bg-animation"]) {
    initializeRuntimeVariables();
    changeDefaultLovelaceStyles()
    initializeBackgroundElements()
    await getGalleryRootManifest();
    await setupPlaylist();
  }
};

initialize();

class LovelaceBgAnimation extends HTMLElement {
  constructor() {
    super();
    if (rootPluginConfig !== undefined) {
      this.styles = `
      @import url('${lovelaceUI.pluginAssetPath}/frontend/css/fontawesome.min.css');
      @import url('${lovelaceUI.pluginAssetPath}/frontend/css/regular.min.css');
      @import url('${lovelaceUI.pluginAssetPath}/frontend/css/solid.min.css');
      @font-face {
        font-family: 'Chivo Mono';
        font-style: normal;
        font-weight: 500;
        src: local('Chivo Mono'), url('${lovelaceUI.pluginAssetPath}/frontend/webfonts/ChivoMono[wght].woff') format('woff');
    }
    @font-face {
        font-family: 'Chivo Mono';
        font-style: italic;
        font-weight: 500;
        src: local('Chivo Mono'), url('${lovelaceUI.pluginAssetPath}/frontend/webfonts/ChivoMono-Italic[wght].woff') format('woff');
    }
      `;
    }
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
  getCardConfig() {
    return {
      "ticker": {
        "labels": this.config.labels ?? {
          "name": {
            show: true,
            style: false,
            name: "Name"
          },
          "description": {
            show: true,
            style: false,
            name: "Name"
          },
          "author": {
            show: true,
            style: false,
            name: "Author"
          }
        },
        "show": this.config.show ?? true,
        "style": this.config.style ?? false,
      }
    }
  }

  set hass(hass) {
    if (rootPluginConfig !== undefined) {
      if (!this.content) {
        this.innerHTML = `
            <style>
              ${this.styles}
            </style>
            <link rel="stylesheet" href="${lovelaceUI.pluginAssetPath}/frontend/css/card.css">
            <ha-card>
              <div class="card-content">
                <div class="media-player">
                  <button class="control-button" id="back">
                    <i class="fas fa-backward"></i>
                  </button>
                  <button class="control-button" id="toggle">
                    <i class="fas fa-play"></i>
                  </button>
                  <div class="media-name-container">
                    Unknown
                  </div>
                  <button class="control-button" id="forward">
                    <i class="fas fa-forward"></i>
                  </button>
                </div>
              </div>
            </ha-card>
      `;

        this.content = this.querySelector("div");
        this.content.querySelectorAll('.control-button').forEach(button => {
          button.addEventListener('click', () => {
            let currentViewPath = getCurrentViewPath();
            let playlistIndex = getPlaylistIndex();
            let currentPlaylist = rootPluginConfig?.background?.view[currentViewPath] ? rootPluginConfig?.background?.view[currentViewPath] : rootPluginConfig?.background?.global

            if (currentPlaylist.length == 1) {
              console.log("Playlist only has one item, skipping interval.")
              return;

            }
            switch (button.id) {
              case 'back':
                playlistIndex.next = playlistIndex.current - 1 < 0 ? currentPlaylist.length - 1 : playlistIndex.current - 1;
                startPlaylistInterval(currentPlaylist)
                break;
              case 'toggle':
                if (window.__global_minterval) {
                  clearTimeout(window.__global_minterval);
                }
                break;
              case 'forward':
                playlistIndex.next = (playlistIndex.current + 1) % currentPlaylist.length;
                startPlaylistInterval(currentPlaylist)
                break;
              default:
                break;
            }

          });
        });

        document.addEventListener('mediaUpdate', (e) => {
          let packageConfig = e.detail.message.packageConfig;
          let packageManifest = e.detail.message.packageManifest;
          let cardConfig = this.getCardConfig();

          let mediaInfo = `
          <div class="media-ticker">
            ${cardConfig.ticker.labels.name.show ? `<span class="soft" ${cardConfig.ticker.labels.name.style ? 'style="' + cardConfig.ticker.labels.name.style + '"' : ''}>${cardConfig.ticker.labels.name.name}:</span> ${packageManifest.metadata?.name ?? packageConfig.id}` : ''}
            ${cardConfig.ticker.labels.description.show ? `<span class="soft" ${cardConfig.ticker.labels.description.style ? 'style="' + cardConfig.ticker.labels.description.style + '"' : ''}>${cardConfig.ticker.labels.description.name}:</span> ${packageManifest.metadata?.description ?? "No description available."}` : ''}
            ${cardConfig.ticker.labels.author.show ? `<span class="soft" ${cardConfig.ticker.labels.author.style ? 'style="' + cardConfig.ticker.labels.author.style + '"' : ''}>${cardConfig.ticker.labels.author.name}:</span> ${packageManifest.metadata?.author ?? "Unknown"}` : ''}
            <i class="toggle-button fa ${window.__global_minterval ? 'fa-pause' : 'fa-play'}"></i>
          </div>
        `;

          this.content.querySelector('.media-name-container').innerHTML = mediaInfo;
          var tickerSelector = this.content.querySelector('.media-ticker');
          var tickerLength = tickerSelector.offsetWidth;
          var timeTaken = tickerLength / 60;
          tickerSelector.style.animationDuration = timeTaken + "s";
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
