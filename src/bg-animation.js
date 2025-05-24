import YAML from 'yaml'
import * as sass from 'sass';

var isDebug = false,
  pluginVersion = VERSION || "dev",
  lovelaceUI = {},
  viewPath,
  rootPluginConfig,
  galleryRootManifest,
  zIndex = 1,
  domObserver = {},
  processedPackageManifests = {},
  playlistIndexes = {},
  applicationIdentifiers = { "appNameShort": "lovelace-bg-animation", "rootFolderName": "lovelace-bg-animation", "scriptName": ["bg-animation.min.js", "bg-animation.js"] }, memoryCache = {}, uiWriteDelay;

function sortArray(array, method) {
  const methods = { random: () => array.sort(() => Math.random() - 0.5), reverse: () => array.reverse(), id_asc: () => array.sort((a, b) => a.id - b.id), id_desc: () => array.sort((a, b) => b.id - a.id) };
  return methods[method]?.() || console.error('Invalid sorting method') || array;
}

async function setPlaylistIndexes() {
  playlistIndexes = { "global": { "current": 0, "next": 0, "timeout": false }, "view": { "current": 0, "next": 0, "timeout": false } }
}

async function getGalleryRootManifest() {
  try {
    let checkCacheGalleryManifest = retrieveCache(applicationIdentifiers["appNameShort"] + "_galleryRootManifest");
    if (checkCacheGalleryManifest && rootPluginConfig.cache === true) {
      galleryRootManifest = checkCacheGalleryManifest
      return true;
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
        storeCache(applicationIdentifiers["appNameShort"] + "_galleryRootManifest", responseJson)
      }
      galleryRootManifest = responseJson
    }

  } catch (error) {
    isDebug ? console.error("getGalleryRootManifest: Failed to fetch gallery manifest:", error) : null;
    return null;
  }
}

async function getPackageManifest(packageConfig) {
  try {
    isDebug ? console.log("getPackageManifest: " + packageConfig?.id) : null;
    let packageManifestId = packageConfig.id;
    let packageCacheKey = btoa(packageManifestId + Object.entries(packageConfig.parameters || { 0: "none" }).map(([key, value]) => `${key}:${value}`).join(' '));
    let checkCachePackageManifest = retrieveCache(applicationIdentifiers["appNameShort"] + "_packageRaw__" + packageCacheKey);
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
        storeCache(applicationIdentifiers["appNameShort"] + "_packageRaw__" + packageCacheKey, packageManifest);
      }
      return packageManifest;
    }
  } catch (error) {
    isDebug ? console.error("getPackageManifest: Failed to fetch package manifest: " + packageManifestId, error) : null;
    return null;
  }
}

async function processPackageManifest(packageConfig, packageManifest) {
  try {
    isDebug ? console.log("processPackageManifest: Called packagemani") : null;

    let packageManifestName = packageConfig.id;
    let packageCacheKey = btoa(packageManifestName + Object.entries(packageConfig.parameters || { 0: "none" }).map(([key, value]) => `${key}:${value}`).join(' '));
    let checkCachePackageManifest = retrieveCache(applicationIdentifiers["appNameShort"] + "_packageProcessed__" + packageCacheKey);
    if (checkCachePackageManifest && packageConfig.cache === true && rootPluginConfig.cache === true) {
      return checkCachePackageManifest;
    } else {
      let environment = {}
      if (rootPluginConfig.gallery.type == "local") {
        environment["rootPath"] = window.location.origin + lovelaceUI.pluginAssetPath;
      } else {
        environment["rootPath"] = rootPluginConfig.gallery.remoteRootUrl;
      }

      environment["basePath"] = environment["rootPath"] + "/gallery/packages/" + packageManifestName + "/";
      environment["commonPath"] = environment["rootPath"] + "/gallery/common/"

      if (packageManifest.compile) {
        for (const [index, value] of packageManifest.compile.entries()) {
          if (value.hasOwnProperty("scss")) {
            packageManifest.compile[index]["__processed"] = sass.compileString(packageManifest.compile[index].scss).css;
          }
        }
      }
      packageManifest.template__processed = packageManifest.template

      if (typeof window !== 'undefined') {
        if (packageManifest?.helpers?.insert_baseurl == true) {
          isDebug ? console.log("processPackageManifest: Inserting baseurl") : null;
          let insert_baseurl = '<base href="' + environment["basePath"] + '" target="_blank">';
          if (packageManifest.template.includes('<head>')) {
            packageManifest.template__processed = packageManifest.template.replace(/(?<=<head>)/, `\n${insert_baseurl}`);
          } else if (packageManifest.template.includes('<html>')) {
            packageManifest.template__processed = packageManifest.template.replace(/(?<=<html>)/, `\n${insert_baseurl}`);
          }
        }
      }

      if (packageManifest.template) {
        const regex = /\{\{\s*(compile|parameter|parameters|param|metadata|meta|environment|env|common):\s*([\s\S]*?)\s*\}\}/g;

        packageManifest.template__processed = packageManifest.template__processed.replace(regex, function (match, type, key) {
          key = key.trim();
          switch (type) {
            case 'compile':
              return packageManifest.compile.find(item => item.id === key)?.__processed || '';
            case 'parameters':
            case 'parameter':
            case 'param':
              return (packageConfig.parameters && packageConfig.parameters[key]) ? packageConfig.parameters[key] : packageManifest.parameters.find(item => item.name == key)?.default || match;
            case 'metadata':
            case 'meta':
              return packageManifest.metadata?.[key] || match;
            case 'environment':
            case 'env':
              return environment[key] || match;
            case 'common':
              try {
                if (galleryRootManifest?.common && galleryRootManifest?.common[key]) {
                  return environment["commonPath"] + galleryRootManifest?.common[key].hash + "_" + galleryRootManifest?.common[key].filename
                } else {
                  return match;
                }
              } catch (error) {
                console.error(`Failed to process common: ${key}`, error);
                return match;
              }
            default:
              return match;
          }
        });

      } else {
        isDebug ? console.error("processPackageManifest: Template does not exist in package, it is required.") : null;
      }

      if (packageConfig.cache === true && rootPluginConfig.cache === true) {
        storeCache(applicationIdentifiers["appNameShort"] + "_packageProcessed__" + packageCacheKey, packageManifest);
      }

      return packageManifest;
    }

  } catch (error) {
    isDebug ? console.error("processPackageManifest: Failed to process the package manifest: " + packageManifest, error) : null;
    return null;
  }
}

function retrieveCache(cacheKey) {
  try {
    const item = sessionStorage.getItem(cacheKey);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    isDebug ? console.error("retrieveCache: Error accessing sessionStorage:", error) : null;
    return null;
  }
}

function storeCache(cacheKey, data) {
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (error) {
    isDebug ? console.error("storeCache: Error storing data in sessionStorage:", error) : null;
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
      let src = memoryCache.scriptTags.src.replace(window.location.origin, '').split('?')[0];
      applicationIdentifiers.scriptName.forEach(key => src = src.replace(key, ''));
      memoryCache.installPath = src.replace('/dist/', '/dist').replace(/\/$/, '');
      isDebug ? console.log("opportunisticallyDetermineLocalInstallPath: " + memoryCache.installPath) : null;
    }
    return memoryCache.installPath;
  } catch (error) {
    return null;
  }
}

function processBackgroundSchema(config) {
  return config
    ? config.map(item => ({
      ...item,
      style: item?.style ?? 'min-width: 100vw; min-height: 100vh; border:0; overflow: hidden;',
      cache: item?.cache !== undefined ? item.cache : true,
      duration: item?.duration ?? false,
      redraw: item?.redraw ?? 0,
      conditions: item?.conditions ?? false,
      overlays: item?.overlays
        ? item.overlays.map(overlay => ({
          ...overlay,
          style: overlay?.style ?? 'min-width: 100vw; min-height: 100vh; border:0; overflow: hidden;',
          cache: overlay?.cache !== undefined ? overlay.cache : true,
          duration: overlay?.duration ?? false,
          overlays: overlay?.overlays ?? false,
          redraw: overlay?.redraw ?? 0,
        }))
        : false,
    }))
    : false;
}

function initializeRuntimeVariables() {
  if (!lovelaceUI?.lovelaceObject?.config["bg-animation"]) {
    isDebug ? console.log("initializeRuntimeVariables: No bg-animation config found in lovelace configuration: ") : null;
    return false;
  }

  rootPluginConfig = lovelaceUI?.lovelaceObject?.config["bg-animation"]
  rootPluginConfig = {
    "gallery": {
      "type": rootPluginConfig.gallery?.type ?? "remote",
      "localRootPath": rootPluginConfig.gallery?.localRootPath ?? "/local/lovelace-bg-animation/dist",
      "manifestFileName": rootPluginConfig.gallery?.manifestFileName ?? "gallery.manifest",
      "remoteRootUrl": rootPluginConfig.gallery?.remoteRootUrl ?? "https://ibz0q.github.io/lovelace-bg-animation"
    },
    "transition": {
      "enable": rootPluginConfig.transition?.enable ?? true,
      "duration": rootPluginConfig.transition?.duration ?? 1000,
    },
    "overlay": {
      "show": rootPluginConfig.overlay?.show ?? true,
      "style": rootPluginConfig.overlay?.style ?? "",
    },
    "duration": rootPluginConfig.duration ?? 50000,
    "conditions": rootPluginConfig.conditions ?? {},
    "loadTimeout": rootPluginConfig.loadTimeout ?? 5000,
    "cache": rootPluginConfig.cache !== undefined ? rootPluginConfig.cache : true,
    "parentStyle": rootPluginConfig.parentStyle ?? "position: fixed; right: 0; top: 0; min-width: 100vw; min-height: 100vh; z-index: -10;",
    "transparency": {
      "header": {
        "enable": rootPluginConfig.transparency?.header?.enable ?? true,
        "style": rootPluginConfig.transparency?.header?.style ?? ".header {background: transparent !important;}",
      },
      "sidebar": {
        "enable": rootPluginConfig.transparency?.sidebar?.enable ?? false,
        "style": rootPluginConfig.transparency?.sidebar?.style ?? "ha-sidebar {background: transparent !important;}",
      },
      "background": rootPluginConfig.transparency?.background ?? "#view > hui-view-background, #view > hui-view, #view {background: transparent !important;}",
    },
    "background": {
      "global": processBackgroundSchema(rootPluginConfig.background.global),
      "view": rootPluginConfig.background.view
        ? Object.keys(rootPluginConfig.background.view).reduce((acc, key) => {
          acc[key] = processBackgroundSchema(rootPluginConfig.background.view[key]);
          return acc;
        }, {})
        : false,
    },
    "sort": ["random", "reverse", "id_asc", "id_desc"].includes(rootPluginConfig?.sort) ? rootPluginConfig.sort : "random"
  }

  lovelaceUI.pluginAssetPath = (() => {
    if (rootPluginConfig.gallery?.type == "local") {
      if (lovelaceUI?.lovelaceObject?.config["bg-animation"].localRootPath) {
        return lovelaceUI?.lovelaceObject?.config["bg-animation"].localRootPath;
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
    lovelaceUI.sidebarElement = lovelaceUI.haMainElement?.querySelector("ha-sidebar");
    lovelaceUI.viewElement = lovelaceUI.huiRootElement?.shadowRoot?.querySelector("#view");
    lovelaceUI.huiViewElement = lovelaceUI.viewElement?.querySelector("hui-view");
    lovelaceUI.groundElement = lovelaceUI.huiRootElement?.shadowRoot?.querySelector("div");
    lovelaceUI.lovelaceObject = lovelaceUI.huiRootElement?.lovelace;
    return !!lovelaceUI.lovelaceObject;
  } catch (error) {
    isDebug ? console.error("initializeLovelaceVariables: Error in initializeRuntimeVariables:", error) : null;
    return false;
  }
}

function initializeBackgroundElements() {
  isDebug ? console.log("initializeBackgroundElements: Called") : null;
  if (lovelaceUI.groundElement.querySelector("#bg-animation-container")) {
    lovelaceUI.groundElement.querySelector("#bg-animation-container").remove();
  }
  lovelaceUI.bgRootElement = document.createElement("div");
  lovelaceUI.bgRootElement.id = "bg-animation-container";
  lovelaceUI.bgRootElement.style.cssText = rootPluginConfig.parentStyle;
  lovelaceUI.groundElement.prepend(lovelaceUI.bgRootElement);
  isDebug ? console.log("initializeBackgroundElements: Created element") : null;
  ["bg-animation-0", "bg-animation-1"].forEach((index, key) => {
    lovelaceUI.bgRootElement.insertAdjacentHTML('beforeend', `<div id="${index}" class="bg-animation-container" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%"></div>`);
  });
  lovelaceUI.frameContainers = lovelaceUI.bgRootElement.querySelectorAll('.bg-animation-container');
  if (rootPluginConfig.overlay?.show) {
    lovelaceUI.bgRootElement.insertAdjacentHTML('beforeend', `<div id="bg-overlay" ${rootPluginConfig.overlay.style ? `style="${rootPluginConfig.overlay.style}"` : ''}></div>`);
  }
}
function changeDefaultLovelaceStyles() {
  lovelaceUI.rootStyleElement = lovelaceUI.huiRootElement.shadowRoot.querySelector("#bg-animation-styles-root");
  if (!lovelaceUI.rootStyleElement) {
    lovelaceUI.rootStyleElement = document.createElement("style");
    lovelaceUI.rootStyleElement.id = "bg-animation-styles-root";
    lovelaceUI.huiRootElement.shadowRoot.prepend(lovelaceUI.rootStyleElement);
  }
  let cssText = rootPluginConfig.transparency.background;
  if (rootPluginConfig.transparency.header.enable == true) {
    cssText += rootPluginConfig.transparency.header.style;
  }
  lovelaceUI.rootStyleElement.innerHTML = cssText;
}

async function processBackgroundFrame(packageConfig, packageManifest) {
  isDebug ? console.log("processBackgroundFrame: Called") : null;
  const createIframe = (containerElement) => {
    const iframeElement = document.createElement('iframe');
    iframeElement.frameborder = "0";
    iframeElement.scrolling = "no";
    iframeElement.srcdoc = "<style>*{background:black;}</style>";
    iframeElement.className = applicationIdentifiers.appNameShort;
    iframeElement.style.cssText = packageConfig.style;
    Object.assign(iframeElement.style, { zIndex: zIndex++, opacity: '0', position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', transition: rootPluginConfig.transition.enable ? `opacity ${rootPluginConfig.transition.duration}ms ease-in-out` : '' });
    iframeElement.srcdoc = packageManifest.template__processed;
    containerElement.replaceChildren(iframeElement);
    iframeElement.contentWindow[applicationIdentifiers.appNameShort] = {
      "basePath": lovelaceUI.pluginAssetPath + "/gallery/packages/" + packageConfig.id + "/",
      "commonPath": lovelaceUI.pluginAssetPath + "/gallery/common/",
      "rootPath": lovelaceUI.pluginAssetPath + "/",
      "assetPath": lovelaceUI.pluginAssetPath + "/gallery/packages/" + packageConfig.id + "/",
      "packageManifest": packageManifest,
      "packageConfig": packageConfig
    };
    return iframeElement;
  };

  const loadIframeWithHardTimeout = (iframe, timeoutDuration) =>
    new Promise(resolve => {
      const timeoutId = setTimeout(() => resolve(true), timeoutDuration);
      iframe.onload = iframe.onerror = () => {
        clearTimeout(timeoutId);
        resolve(true);
      };
    });

  let inactiveFrame = Array.from(lovelaceUI.frameContainers).find(frame => frame.getAttribute('data-frame-active') !== 'true'),
    activeFrame = Array.from(lovelaceUI.frameContainers).find(frame => frame.getAttribute('data-frame-active') == 'true');

  if (inactiveFrame) {
    isDebug ? console.log("processBackgroundFrame: Inactive frame") : null;
    let iframeElm = createIframe(inactiveFrame);
    await loadIframeWithHardTimeout(iframeElm, rootPluginConfig.loadTimeout);
    inactiveFrame.setAttribute('data-frame-active', 'true');
    iframeElm.style.opacity = '1';
    if (activeFrame) {
      isDebug ? console.log("processBackgroundFrame: Found active frame") : null;
      activeFrame.setAttribute('data-frame-active', 'false');
      let activeFrameIframe = activeFrame.querySelector('iframe');
      await new Promise(resolve => setTimeout(() => {
        activeFrameIframe.remove();
        resolve();
      }, rootPluginConfig.transition.enable ? rootPluginConfig.transition.duration + 200 : 0));
      isDebug ? console.log("processBackgroundFrame: end active") : null;
    }
  } else {
    isDebug ? console.log("processBackgroundFrame: No inactive frame found") : null;
    lovelaceUI.frameContainers.forEach(frame => {
      frame.innerHTML = '';
      frame.setAttribute('data-frame-active', 'false');
    });
  }
}

function getCurrentViewPath() {
  return window.location.pathname.split('/')[2];
}

function getPlaylistIndex() {
  return playlistIndexes[rootPluginConfig?.background?.view[getCurrentViewPath()] ? "view" : "global"];
}

window.bgMediaGovernor = function (action, secondary) {
  let currentViewPath = getCurrentViewPath();
  let playlistIndex = getPlaylistIndex();
  let currentPlaylist = rootPluginConfig?.background?.view[currentViewPath] ? rootPluginConfig?.background?.view[currentViewPath] : rootPluginConfig?.background?.global

  if (currentPlaylist.length == 1) {
    isDebug ? console.log("Card: Playlist only has one item, skipping interval.") : null;
    return;
  }
  switch (action) {
    case 'back':
      playlistIndex.next = playlistIndex.current - 1 < 0 ? currentPlaylist.length - 1 : playlistIndex.current - 1;
      startPlaylistInterval(currentPlaylist)
      break;
    case 'toggle':
      isDebug ? console.log("Toggle") : null;
      document.dispatchEvent(new CustomEvent('mediaTickerUpdate', { detail: { message: { "packageConfig": currentPlaylist[playlistIndex.current], "packageManifest": processedPackageManifests[currentPlaylist[playlistIndex.current].id] } } }));
      if (window.__global_minterval) {
        clearTimeout(window.__global_minterval);
        playlistIndex.timeout = false;
      }
      break;
    case 'forward':
      playlistIndex.next = (playlistIndex.current + 1) % currentPlaylist.length;
      startPlaylistInterval(currentPlaylist)
      break;
    case 'play_track':
      if (!secondary) {
        isDebug ? console.log("No track id provided, skipping") : null;
        return;
      }
      let track = currentPlaylist.findIndex(track => track.id == secondary);
      if (track == -1) {
        isDebug ? console.log("Track not found in playlist, skipping") : null;
        return;
      }
      playlistIndex.next = currentPlaylist.findIndex(track => track.id == secondary);
      startPlaylistInterval(currentPlaylist)
      break;
    default:
      break;
  }
};

async function startPlaylistInterval(currentPlaylist) {
  isDebug ? console.log("startPlaylistInterval: Setup playlist Int") : null;
  let playlistIndex = getPlaylistIndex();
  let currentPlaylistTrack = currentPlaylist[playlistIndex.next]
  let duration = currentPlaylistTrack?.duration ? currentPlaylistTrack.duration : rootPluginConfig.duration;
  let packageManifest = await getPackageManifest(currentPlaylistTrack);
  let processedPackageManifest = await processPackageManifest(currentPlaylistTrack, packageManifest);
  processedPackageManifests[currentPlaylistTrack.id] = processedPackageManifest;
  await processBackgroundFrame(currentPlaylistTrack, processedPackageManifest);

  document.dispatchEvent(new CustomEvent('mediaTickerUpdate', { detail: { message: { "packageConfig": currentPlaylistTrack, "packageManifest": processedPackageManifest } } }));

  playlistIndex.current = playlistIndex.next;
  playlistIndex.next = (playlistIndex.next + 1) % currentPlaylist.length;

  if (playlistIndex.current == playlistIndex.next) {
    isDebug ? console.log("startPlaylistInterval: Playlist only has one item, skipping interval.") : null;
    return;
  }

  if (window.__global_minterval) {
    clearTimeout(window.__global_minterval);
  }

  if (duration !== 0) {
    window.__global_minterval = setTimeout(() => {
      startPlaylistInterval(currentPlaylist)
    }, duration)
  }

  playlistIndex.timeout = true

}

async function setupPlaylist() {
  viewPath = getCurrentViewPath();
  isDebug ? console.log(`setupPlaylist: Current viewpath=${viewPath}`) : null;

  if (rootPluginConfig.background.view[viewPath] || rootPluginConfig.background.global) {
    let currentPlaylist = sortArray(rootPluginConfig?.background?.view[viewPath] ? rootPluginConfig?.background?.view[viewPath] : rootPluginConfig?.background?.global, rootPluginConfig.sort);

    currentPlaylist = currentPlaylist.filter(track => {
      let trackExists = galleryRootManifest.packages.some(manifest => manifest.id === track.id);
      if (!trackExists) {
        isDebug ? console.log(`setupPlaylist: Track id ${track.id} does not exist in the manifest and has been removed.`) : null;
      }

      if (track.conditions?.exclude_user && track.conditions?.include_user) {
        isDebug ? console.log(`setupPlaylist: Track id ${track.id} has both excludeUsers and includeUsers conditions, this is not supported. Ignored.`) : null;

      } else if (track.conditions?.include_user || track.conditions?.exclude_user) {
        let userName = lovelaceUI.haMainElement?.host?.hass?.user?.name;
        isDebug ? console.log(`setupPlaylist: Track id ${track.id} has user conditions, checking user: ${userName}`) : null;

        if (userName && track.conditions?.exclude_user) {
          let userExist = track.conditions.exclude_user.includes(userName);
          if (userExist) {
            isDebug ? console.log(`setupPlaylist: Track id ${track.id} excluded due to user condition.`) : null;
            return false;
          }
          isDebug ? console.log(`setupPlaylist: Track id ${track.id} included due to user condition.`) : null;
        }

        if (userName && track.conditions?.include_user) {
          let userExist =  track.conditions.include_user.includes(userName);
          if (!userExist) {
            isDebug ? console.log(`setupPlaylist: Track id ${track.id} not included due to user condition.`) : null;
            return false;
          }
          isDebug ? console.log(`setupPlaylist: Track id ${track.id} included due to user condition.`) : null;
        }

      }
      return trackExists;
    });

    if (currentPlaylist.length === 0) {
      isDebug ? console.error("setupPlaylist: No valid tracks found after filtering, unable to continue.") : null;
      return;
    }

    if (window.__global_minterval) {
      clearTimeout(window.__global_minterval);
    }

    startPlaylistInterval(currentPlaylist);

  } else {
    isDebug ? console.error("setupPlaylist: setupPlaylist: No backgrounds found in the user config.") : null;
  }
}

async function initializeObservers() {
  isDebug ? console.log("initializeObservers: called") : null;

  if (domObserver.haMainElement) {
    domObserver.haMainElement.disconnect();
  }

  domObserver.haMainElement = new MutationObserver((mutations) => {
    mutations.forEach(function (mutation) {
      if (mutation.addedNodes.length > 0) {
        uiWriteDelay = setTimeout(() => {
          isDebug ? console.log("initializeObservers: haMainElement ") : null;
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
          if (rootPluginConfig?.background?.view[getCurrentViewPath()] || (rootPluginConfig?.background?.view[viewPath] && rootPluginConfig?.background?.global)) {
            await getGalleryRootManifest();
            await setupPlaylist();
          }
          if (removedNode === lovelaceUI.viewElement) {
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
            isDebug ? console.log("initializeObservers: hui-editor") : null;
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
        isDebug ? console.log("initializeObservers: panelElement huiRootElement") : null;
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
  isDebug = lovelaceUI?.lovelaceObject?.config["bg-animation"]?.debug ?? isDebug;
  isDebug ? console.log(`initialize plugin: ${pluginVersion}`) : null;

  if (initializeLovelaceVars == true) {
    await initializeObservers();
  } else {
    isDebug ? console.log("initialize: Failed to initialize lovelace variables from this view.") : null;
  }

  isDebug ? console.log("initialize: after") : null;

  if (initializeLovelaceVars == true && lovelaceUI.lovelaceObject.config["bg-animation"]) {
    initializeRuntimeVariables();
    changeDefaultLovelaceStyles()
    initializeBackgroundElements()
    await setPlaylistIndexes();
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
      @import url('${lovelaceUI.pluginAssetPath}/src/css/fontawesome.min.css');
      @import url('${lovelaceUI.pluginAssetPath}/src/css/regular.min.css');
      @import url('${lovelaceUI.pluginAssetPath}/src/css/solid.min.css');
      @font-face {
        font-family: 'Chivo Mono';
        font-style: normal;
        font-weight: 500;
        src: local('Chivo Mono'), url('${lovelaceUI.pluginAssetPath}/src/webfonts/ChivoMono[wght].woff') format('woff');
    }
    @font-face {
        font-family: 'Chivo Mono';
        font-style: italic;
        font-weight: 500;
        src: local('Chivo Mono'), url('${lovelaceUI.pluginAssetPath}/src/webfonts/ChivoMono-Italic[wght].woff') format('woff');
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
            name: " / "
          },
          "author": {
            show: true,
            style: false,
            name: "Author"
          }
        },
        "speed": this.config.speed ?? 60,
        "show": this.config.show ?? true,
        "style": this.config.style ?? false,
      }
    }
  }

  set hass(hass) {
    if (rootPluginConfig !== undefined) {
      if (!this.content) {
        this.innerHTML = `<style>${this.styles}</style><link rel="stylesheet" href="${lovelaceUI.pluginAssetPath}/src/css/card.css"><ha-card><div class="card-content"><div class="media-player"><button class="control-button" id="back"><i class="fas fa-backward"></i></button><button class="control-button" id="toggle"><i class="fas fa-play"></i></button><div class="media-name-container">Unknown</div><button class="control-button" id="forward"><i class="fas fa-forward"></i></button></div></div></ha-card>`;
        this.content = this.querySelector("div");
        this.content.querySelectorAll('.control-button').forEach(button => {
          button.addEventListener('click', () => {
            window.bgMediaGovernor(button.id);
          });
        });

        document.addEventListener('mediaTickerUpdate', (e) => {
          let packageConfig = e.detail.message.packageConfig;
          let packageManifest = e.detail.message.packageManifest;
          let cardConfig = this.getCardConfig();
          let playlistIndex = getPlaylistIndex();

          let mediaInfo = `
            <div class="media-ticker">
              ${cardConfig?.ticker?.labels?.name?.show ? `<span class="soft" ${cardConfig?.ticker?.labels?.name?.style ? 'style="' + cardConfig?.ticker?.labels?.name?.style + '"' : ''}>${cardConfig?.ticker?.labels?.name?.name ?? "Name: "}</span> ${packageManifest.metadata?.name ?? packageConfig.id}` : ''}
              ${cardConfig?.ticker?.labels?.description?.show ? `<span class="soft" ${cardConfig?.ticker?.labels?.description?.style ? 'style="' + cardConfig?.ticker?.labels?.description?.style + '"' : ''}>${cardConfig?.ticker?.labels?.description?.name ?? "Description: "}</span> ${packageManifest.metadata?.description ?? "No description available."}` : ''}
              ${cardConfig?.ticker?.labels?.author?.show ? `<span class="soft" ${cardConfig?.ticker?.labels?.author?.style ? 'style="' + cardConfig?.ticker?.labels?.author?.style + '"' : ''}>${cardConfig?.ticker?.labels?.author?.name ?? "Author: "}</span> ${packageManifest.metadata?.author ?? "Unknown"}` : ''}</i>
            </div>
        `;

          let toggleButton = this.content.querySelector('.media-player #toggle');
          if (toggleButton) {
            toggleButton.innerHTML = `<i class="toggle-button fa ${playlistIndex?.timeout == false ? 'fa-pause' : 'fa-play'}"></i>`;
          }

          this.content.querySelector('.media-name-container').innerHTML = mediaInfo;
          var tickerSelector = this.content.querySelector('.media-ticker');
          var tickerLength = tickerSelector.offsetWidth;
          var timeTaken = tickerLength / cardConfig?.ticker?.speed ?? 60;
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
  static getStubConfig() {
    return { "type": "custom:lovelace-bg-animation" }
  }
}
customElements.define('lovelace-bg-animation', LovelaceBgAnimation);
window.customCards = window.customCards || [];
window.customCards.push({ type: "lovelace-bg-animation", name: "Lovelace BG Animation", preview: true, documentationURL: "https://github.com/ibz0q/lovelace-bg-animation" });