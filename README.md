# Lovelace Background Animation

Current Release: **Development**

A small Lovelace plugin that replaces the background with an animated one, various animations available. 

## 🎀 Tribute to the artists 

The repo features the following artists with incredible works they've shared on the web. Please support them. In order featured works in this repo.

 - Ben Matthews (6)
 - Matei Copot (6)
 - Akimitsu Hamamuro (2)
 - Bas Groothedde (2)
 - Rahul (1)
 - Takeshi Kano (1)
 - cssscript.com (1)
 - alphardex (1)
 - Alex Andrix (1)
 - Andreas Wilcox (1)

### Donations and Tips

Please directly tip the artists you found most inspiring.

## Motivation

Mostly nostalgia reasons. When Canvas/JS/CSS3 was new to the web I remember the awe of abstract web experiments. I wanted to preserve some and view them like art pieces on my Home Assistant tablet/dashboard, they make great backgrounds!

Some of the experiments I have saved in my bookmarks overtime have long been lost or forgotten because of the passage of time. Occasionally I would save these to disk. A number of experiments only exist here now because of this. 

I have tried my best to find references and credit the artists who's original work has been lost to digital oblivion, archive.org links provided if they are available - This is not always the case.

### License 

This project is compromised of the works of various artists each either their own licensing terms, none of this projects license are imposed. Copyrights are preserved respectively. 

For this reason, code belonging to this repo (bg-annimation.js) uses CC BY-NC 4.0 Deed Attribution-NonCommercial 4.0 International.

Code inside Gallery carries the Licenses and Copyrights of their authors respectively. 

## Install

You can install this plugin using HACS and manually. 


## Usage

Config needs to be placed inside Lovelaces config file, you can do this inside the Lovelace UI > Edit mode > Raw Configuration Editor.

` * = Optional `

```yaml
bg-animation: # Root configuration object
  duration: 5000 # * Duration of the animation in milliseconds
  redraw: 200000 # * Time in milliseconds after which the animation should be redrawn
  style: | # * CSS can be applied to the root container above the Iframe
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
    view: # View-specific background settings e.g. http://homeassistant/lovelace/home - "home"
      home: # Settings for the 'home' view
        - id: 11.space # Identifier for a background
        - id: 15.sound # Identifier for another background
      home: # e.g. http://homeassistant/lovelace/gruffalo - "gruffalo" etc
        - id: 11.space # Identifier for a background
        - id: 15.sound # Identifier for another background
```

### Offline mode

Offline mode was a core design feature, by default the plugin connects to this repos Github page. You can override this by using the below.

```yaml
bg-animation: # Root configuration object
  type: local # Specifies the type of gallery, 'local' means the gallery is hosted on the same server
```

This will tell the plugin to load everything from Home Assistant only. It's also useful if you wish to develop and test your own packages too.

### Adding your own packages 

Everything is self contained inside package.yaml. Instead of embedding plain HTML files I wanted structure and provide a basic templating and user customizability. This ruled out plain HTML files.

Although you may see some packages.yaml contain remote scripts like three.js or Stats.js. Please try to inline or locally save assets as some browsers demonstrate a flash upon loading. This can be prevented using those methods and I am in the process of inling the rest of these.

I accept contributions. Because Javascript is allowed, you must be a reputable user on Github. Submissions need to also be attached to an issue that contains the following info:

- Image Preview
- name: description: author: source: 
- Does the package contain any of the following?
 - - Javascript,
- -  Uncompiled code like pug, scss
- Have you audited the code yourself?
- Is it safe?

Security is the primary requirement, any code that looks to be obfuscated in any way will not be approved. The reason behind this is Home Assistant by nature has a large attack surface. Third party unaudited code presents a big risk.

We will take steps to minimize risk. 

### Features TODO

- Media controls
- Fix iframe writes (Done)
- Add Autoplay
- Add redraw 
- Add duration (Done)
- Iframe transitions 
- postMessage 
- Generate metadata 
  - Video/Picture Preview
  - HTML
- Nice UI Editor
- Add oppurtunistic sanity check for path (Done)
- Add BaseURL (Done)
- Allow for multi instance (Done)