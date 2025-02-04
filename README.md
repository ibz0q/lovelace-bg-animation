# Lovelace Background Animation

Current Release: v1.0.6

A small Lovelace plugin that replaces the background with an animated one, various animations available. 

<p align="center">

[<img src="https://i.imgur.com/PLlO4cA.gif">](https://i.imgur.com/f3hLlRu.mp4)
</p>

Once you're setup and settled in. Take some time to [show off your dashboards to the community](https://github.com/ibz0q/lovelace-bg-animation/discussions/10) ;)

## ✌ Tributes (Artists featured)

 - Jack Rugile (13)
 - Ben Matthews (8)
 - Bas Groothedde (5)
 - Alex Andrix (5)
 - Matei Copot (5)
 - Akimitsu Hamamuro (2)
 - yoichi kobayashi (2)
 - Griffin Moyer (2)
 - Takeshi Kano (1)
 - cssscript.com (1)
 - alphardex (1)
 - Tim Severien (1)
 - DanDog (1)
 - Andreas Wilcox (1)
 - Júlia Erő (1)
 - MenSeb (1)
 - Ana Tudor (1)
 - Ksenia Kondrashova (1)
 - Jared Stanley (1)
 - Nathan Gordon (1)
 - nskrgv (1)
 - Yuki (1)
 - Fabio Ottaviani (1)

### Support this project

<a href="https://buymeacoffee.com/iba0q" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/white_img.png" alt="Buy Me A Coffee" style="height: auto !important;width: auto !important;" ></a>

## Install

You can install this plugin two ways: 

### Option 1: HACS 

Click this button which automatically downloads this plugin. [![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=ibz0q&repository=lovelace-bg-animation&category=Plugin) 

If the above button does not work then:  

Open HACS -> Frontend -> Custom Repositories -> Paste into Repository "ibz0q/lovelace-bg-animation" -> Category -> Lovelace -> Click "Add". 

Click the Explore & Download Repositories button and search for "Live Background Animations" open and click Download.

### Option 2: Manual 

Download the latest release zip. Extract the contents of dist into a folder inside www: homeassistant\config\www\lovelace-background-animation

***Files should be placed so they exist like this:***
```
homeassistant\config\www\lovelace-background-animation\
homeassistant\config\www\lovelace-background-animation\dist\
homeassistant\config\www\lovelace-background-animation\dist\bg-animation.min.js
...
```

Finally go to your Lovelace dashboard, click Edit -> Manage Resources -> Add resource -> URL: /local/lovelace-bg-animation/dist/bg-animation.min.js -> Javascript Module and click Create.

---

Now add a valid configuration (see below). You should see a background animation immediately.

## Usage

Config needs to be placed inside Lovelaces config file, you can do this inside the Lovelace UI > Edit mode > Raw Configuration Editor.

### Minimal Configuration (To get started)

```yaml
bg-animation:
  duration: 60000 # Global duration of each bg
  gallery:
    type: local
  transparency: # Sets the header transparent (Optional)
    header:
      enable: true
  background:
    global: # Add and remove as required
      - id: animation.11.space
      - id: animation.65.cristal-lands
      - id: animation.17.ribbons
      - id: animation.64.howls-moving-castle
      - id: animation.63.green-circuit
      - id: animation.58.browniandrix-noise-l3
      - id: animation.53.stars
      - id: animation.50.sidelined
      
```

Have I said this yet? Once you're setup. [Show off your dashboards to the community](https://github.com/ibz0q/lovelace-bg-animation/discussions/10). There is no telemetry collected by this plug-in so engaging helps me alot!

### Full configuration options
` * = Optional `

```yaml
bg-animation: 
  duration: 5000 # * Duration of the animation in milliseconds (global)
  redraw: 200000 # * Time in milliseconds after which the animation should be redrawn
  style: | # * Change the default style of root container holding iframe (This can cause bugs if original style is not applied)
      background: transparent;
  gallery: # *
    type: local # Type of gallery, "local" | "remote" 
  transparency: # Sets the header transparent (Optional)
    header:
      enable: true
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
          duration: 40000 
        - id: 15.sound # Identifier for another background
      gruffalo: # e.g. http://homeassistant/lovelace/gruffalo - "gruffalo" etc
        - id: 11.space # Identifier for a background
          duration: 40000
        - id: 15.sound # Identifier for another background
          duration: 40000 

```

The plugin also comes with a card: 

```YAML
type: custom:lovelace-bg-animation
```

![alt text](docs/card.png)


### Offline support

Offline mode was a core feature, however backgrounds (packages) too need to load resources locally for this to work. So the plugin by default is remote (connects to this repos Github page https://ibz0q.github.io/lovelace-bg-animation to download resources).

You can override this by using the below.

```yaml
bg-animation: 
  gallery:
    type: local # * Specifies the type of gallery, 'local' means the gallery is hosted on the same server
    localRootPath: "/local/files/custom" # * If your path uses a different one to HACS or /local for some reason
    remoteRootPath: "" # * Specify your own remote path like the one in this repo
    manifestFileName: "" # * Change the name of the manifest
```

This will tell the plugin to load everything locally. It's also useful if you wish to develop and test your own packages.  

### Adding your own packages 

Everything can be self-contained inside package folder. Instead of using plain HTML files I wanted structure and provide a basic templating and user customizability for users. This ruled out plain HTML files. 

You may see some packages.yaml contain remote scripts like three.js or Stats.js. Please try to inline or locally save assets inside the package folder. If your package has a JS libraries, please load using a relative path and place the JS file inside the root of the package folder. 

Ensure you use this in your package.yaml because it tells the transpiler to include a HTML baseURL tag which is calculated and placed into the background Iframe.

```YAML
helpers:
  insert_baseurl: true
```

Include an SRI hash inside your JS tag so this can be validated. Why- Read security section in contributions.

## Contributions

PRs need to be attached to an issue that contains the following info:

- Image Preview
- name: description: author: source: 
- Does the package contain any of the following?
 - - Javascript,
- -  Uncompiled code like pug, scss
- Have you audited the code yourself?
- Is it safe?

 Javascript is allowed and so you must be a reputable user on Github to submit to this repo. Any code that looks to be obfuscated in any way will not be approved. The reason behind this is Home Assistant has quite a big attack surface. We will take steps to minimize risk. 

## Motivation

Mostly nostalgia. Back when HTML5/Canvas/JS/CSS3 was new I remember the awe of abstract animations. I wanted to preserve some and view them like art pieces on my Home Assistant tablet/dashboard which make great backgrounds.

Over time some of the experiments I have saved in my bookmarks have long been lost to digital oblivion. Luckily some I would save to disk.  I have tried my best to find references and credit the artists, archive.org links provided if they are available - This is not always the case.

### License 

This project is compromised of the works of artists each with their own licensing, none of THIS projects license are imposed. Copyrights and original licenses are preserved respectively. The reason for this is a lot of the works are published online under MIT license, ie. <a href="https://blog.codepen.io/documentation/licensing/#:~:text=The%20gist%20of%20it%20is,it%20is%20subject%20to%20removal">Code Pen</a> which is permissive and expects an equally permissive license. However other works are not as permissive, or unlicensed. For this reason, code solely belonging to this repo (bg-animation.js) uses CC BY-NC 4.0 Deed Attribution-NonCommercial 4.0 International which prevents commercial use and works themselves have licenses preserved. This may change at a later date. 


### Features / TODO

- Iframe transitions 
- Add redraw, allows you to repain the iframe within duration period.
- Security:
  - "Official packages" / Community packages via YAML tagging
  - Provide a list of vetted libraries
  - Eventually once all packages are self contained, use "Content-Security-Policy" to prevent external loading of scripts via metatag. 
- Provide a way to add libraries in a trusted manner (Done, docs incoming)
  - Likely: Add packages via CDN into a common folder to be loaded by packages thus reducing overall size.
- Slow down fast moving bgs (in progress)
- postMessage 
- Add ability for Iframe/package to interact with Lovelace Card (In progress)
- Add video background package  
- Default gallery to use all, if nothing is specified. (Removed)
- Serialized data passthrough to Iframe
- Submit to HACS once beta version is mature (Done)
- Add overlay div (Done)
- Media controls (Lovelace Card) (Done)
- Fix iframe writes (Done)
- Add duration (Done)
- Add opportunistic sanity check for path (Done)
- Add BaseURL (Done)
- Allow for multi instance (Done)
- Auto generate metadata (Done)
  - Video/Picture Preview (Done)
  - HTML (Done)
