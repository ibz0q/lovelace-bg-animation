# Lovelace Background Animation

Current Release: **Development**

<video src="https://i.imgur.com/9JHwDRS.mp4
" controls="controls" alt="[![Video/Image Demo](docs/image.png)" autoplay style="max-height: 530px;">
</video>


A small Lovelace plugin that replaces the background with an animated one, various animations available. 

## 🎀 Tributes 

The repo features the following artists with incredible works they've shared on the web. In order featured works in this repo.

#### Artists featured

 - Ben Matthews (7)
 - Matei Copot (6)
 - Bas Groothedde (5)
 - Akimitsu Hamamuro (2)
 - Rahul (1)
 - Takeshi Kano (1)
 - cssscript.com (1)
 - alphardex (1)
 - Tim Severien (1)
 - DanDog (1)
 - Alex Andrix (1)
 - Andreas Wilcox (1)

### Donations and Tips

Please directly tip the artists you found most inspiring.

## Motivation

Mostly for nostalgia. I remember the awe of abstract web experiments when Canvas/JS/CSS3 was new. I wanted to preserve some and view them like art pieces on my Home Assistant tablet/dashboard, they make great backgrounds!

Some of the experiments I have saved in my bookmarks overtime have long been lost or forgotten because of the passage of time. Occasionally I would save these to disk. A number of experiments only exist here now because of this. 

I have tried my best to find references and credit the artists who's original work has been lost to digital oblivion, archive.org links provided if they are available - This is not always the case.

### License 

This project is compromised of the works of various artists each either their own licensing terms, none of this projects license are imposed. Copyrights are preserved respectively. 

For this reason, code belonging to this repo (bg-animation.js) uses CC BY-NC 4.0 Deed Attribution-NonCommercial 4.0 International.

Code inside Gallery carries the Licenses and Copyrights of their authors respectively. 

## Install

You can install this plugin two ways: 

### Option A: HACS (only supports remote loading)

Open HACS -> Frontend -> Custom Repositories -> Paste into Repository "ibz0q/lovelace-bg-animation" -> Category -> Lovelace and click "Add". 

Click the Explore & Download Repositories button and search for "Live Background Animations" open and click Download.

### Option B: Manual (supports local & remote loading)

Download the latest release zip. Extract the contents the folder into www of Home Assistant: homeassistant\config\www\lovelace-background-animation

Files should be placed so they exist like this:

homeassistant\config\www\lovelace-background-animation\
homeassistant\config\www\lovelace-background-animation\package.json
homeassistant\config\www\lovelace-background-animation\dist\
homeassistant\config\www\lovelace-background-animation\dist\bg-animation.min.js

Finally go to your Lovelace dashboard, click Edit -> Manage Resources -> Add resource -> URL: /local/lovelace-bg-animation/frontend/bg-animation.min.js -> Javascript Module and click Create.

---

That's it, if you have a vallid configuration (see below). You should see a background animation immediately.


## Usage

Config needs to be placed inside Lovelaces config file, you can do this inside the Lovelace UI > Edit mode > Raw Configuration Editor.

` * = Optional `

```yaml
bg-animation: 
  duration: 5000 # * Duration of the animation in milliseconds (global)
  redraw: 200000 # * Time in milliseconds after which the animation should be redrawn
  style: | # * Change the default style of root container holding iframe (This can cause bugs if original style is not applied)
      background: transparent;
  gallery: # *
    type: local # Type of gallery, "local" | "remote" 
  header: # *
    transparent: true # If true, the header of the page will be transparent
  cache: false # * If false, nothing will not be cached. Default is true
  sort: random # * Order bgs will be displayed. 'random" | "reverse" | "id_asc" | "id_desc". Default is the order you specify
  background: 
    global: # Global background settings, if no view is specified, will be applied to all views
      - id: 11.space # ID for a background (Folder name of /gallery/package/ID)
        style: # CSS applied to individual bg's, say if you prefer the bg to be darker, acting like an overlay
        parameters: 
          background-image: black # Example of a parameter thats passed onto a background
    view: # View-specific background settings e.g. http://homeassistant/lovelace/lights - "lights"
      lights: # Settings for the 'lights' view
        - id: 11.space # Identifier for a background
        - id: 15.sound # Identifier for another background
      gruffalo: # e.g. http://homeassistant/lovelace/gruffalo - "gruffalo" etc
        - id: 11.space # Identifier for a background
        - id: 15.sound # Identifier for another background
```

### Offline support

Although offline mode was a core feature. Backgrounds (packages) also need to load resources locally, and by default the plugin connects to this repos Github page. 

You can override this by using the below.

```yaml
bg-animation: 
  type: local # * Specifies the type of gallery, 'local' means the gallery is hosted on the same server
  localRootPath: "/local/files/custom" # * If your path uses a different one to HACS or /local for some reason
  remoteRootPath: "" # * Specify your own remote path like the one in this repo
  manifestFileName: "" # * Change the name of the manifest
```

This will tell the plugin to load everything from Home Assistant only. It's also useful if you wish to develop and test your own packages too.  

**HACS Note:** HACS has a limitation which restricts developers ability to ship bundled files. If you choose to go with HACS and want offline support you will need to copy gallery folders into the HACS install space (/www/community/lovelace-bg-animation/*), it seems there is no way to bundle extra files currently and this is unlikely to change.

### Adding your own packages 

Everything is self contained inside package.yaml. Instead of embedding plain HTML files I wanted structure and provide a basic templating and user customizability. This ruled out plain HTML files.

Although you may see some packages.yaml contain remote scripts like three.js or Stats.js. Please try to inline or locally save assets as some browsers demonstrate a flash upon loading. This can be prevented using those methods and I am in the process of inling the rest of these.

## Contributions

PRs need to be attached to an issue that contains the following info:

- Image Preview
- name: description: author: source: 
- Does the package contain any of the following?
 - - Javascript,
- -  Uncompiled code like pug, scss
- Have you audited the code yourself?
- Is it safe?

Because Javascript is allowed, you must be a reputable user on Github. Security is the primary requirement, any code that looks to be obfuscated in any way will not be approved. The reason behind this is Home Assistant has quite a big attack surface. We will take steps to minimize risk. 

### Features TODO

- Add redraw 
- Add overlay div (Done)
- Iframe transitions 
- Media controls (Done)
- Fix iframe writes (Done)
- Add duration (Done)
- Auto generate metadata 
  - Video/Picture Preview
  - HTML
- Add opportunistic sanity check for path (Done)
- Add BaseURL (Done)
- Allow for multi instance (Done)
- postMessage 
- Default gallery to use all, if nothing is specified. (Removed)
- Add a video background 
- Serialize data passthrough