# Lovelace Background Animations 

A Lovelace plugin to replace Home Assistant's background with an animated one with many animations to choose from. 

**Current Release: v1.0.8**

<p align="center">

[<img src="https://i.imgur.com/PLlO4cA.gif">](https://i.imgur.com/f3hLlRu.mp4)
</p>

View all backgrounds here: [docs/EXTENDED.md](https://github.com/ibz0q/lovelace-bg-animation/blob/main/docs/EXTENDED.md)

### Support project

<a href="https://buymeacoffee.com/iba0q" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/white_img.png" alt="Buy Me A Coffee" style="height: auto !important;width: auto !important;" ></a>

## Getting started

> [!NOTE]
> Once installed, you will need a valid configuration

### Option 1: Install with HACS 

Click this button which automatically downloads this plugin.

 [![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=ibz0q&repository=lovelace-bg-animation&category=Plugin) 

Or

Open HACS -> Frontend -> Custom Repositories -> Paste in repository "ibz0q/lovelace-bg-animation" -> Category -> Lovelace -> Click "Add". Click the Explore & Download Repositories button and search for "Live Background Animations" and Download.

### Option 2: Install manually

Download the latest release zip. Extract the contents of dist into a folder inside www: homeassistant\config\www\lovelace-background-animation

***Files should be placed so they exist like this:***
```
homeassistant\config\www\lovelace-background-animation\
homeassistant\config\www\lovelace-background-animation\dist\
homeassistant\config\www\lovelace-background-animation\dist\bg-animation.min.js
...
```

Finally go to your Lovelace dashboard, click Edit -> Manage Resources -> Add resource -> URL: /local/lovelace-bg-animation/dist/bg-animation.min.js -> Javascript Module and click Create.


Config needs to be placed inside Lovelaces config file, you can do this inside the Lovelace UI > Edit mode > Raw Configuration Editor.

### Minimal Configuration (to get started)

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
### All configuration options
` * = Optional `

```yaml
bg-animation: 
  duration: 5000 # * Duration of the animation in milliseconds (global)
  loadTimeout: 2000 # In milliseconds - When Iframe takes longer than this value to load, it is forced to be displayed. This reduces the white flash on some bg's.
  redraw: 200000 # * Time in milliseconds after which the animation should be redrawn
  transition:
    enable: true
    duration: 1500 # Default is 1000
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
      - id: animation.11.space # ID for a background (Folder name of /gallery/package/ID)
        style: # CSS applied to individual bg's, say if you prefer the bg to be darker, acting like an overlay
        parameters: 
          background-image: black # Example of a parameter thats passed onto a background
    view: # View-specific background settings e.g. http://homeassistant/lovelace/lights - "lights"
      lights: # Settings for the 'lights' view
        - id: animation.11.space # Identifier for a background
          duration: 40000 
        - id: animation.15.sound # Identifier for another background
      gruffalo: # e.g. http://homeassistant/lovelace/gruffalo - "gruffalo" etc
        - id: animation.11.space # Identifier for a background
          duration: 40000
        - id: animation.15.square # Identifier for another background
          duration: 40000 

```

There's also a card that let's you control bg's:

![alt text](docs/card.png)

```YAML
type: custom:lovelace-bg-animation
```


## 🎀 Tributes (Artists featured)

 - Jack Rugile (13)
 - Ben Matthews (8)
 - Dillon (6)
 - Bas Groothedde (5)
 - Alex Andrix (5)
 - Matei Copot (5)
 - Boris Šehovac (4)
 - Akimitsu Hamamuro (2)
 - yoichi kobayashi (2)
 - Kevin Levron (2)
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
 - Griffin Moyer (1)
 - tympanus (1)
 - Ray Victor PRO (1)
 - Karl Saunders (1)
 - Matthias Hurrle (1)
 - Lanny (1)
 - Liam Egan (1)
 - AzazelN28 (1)
 - Fabio Ottaviani (1)
 - Sarah Drasner (1)

### 🙏 Contributors

 - [Sjors Kaagman](https://github.com/SjorsMaster) (2)


## Contributions

PRs need to be attached to an issue that contains the following info:

- Image Preview
- name: description: author: source: 
- Does the package contain any of the following?
  - Javascript,
  -  Uncompiled code like pug, scss
- Have you audited the code yourself?

 
## Motivation

Back when HTML5/Canvas/JS/CSS3 was new I remember the awe of abstract animations. I wanted to preserve some and view them like art pieces on my Home Assistant tablet/dashboard which make great backgrounds.

Over time some of the experiments I have saved in my bookmarks have long been lost to digital oblivion. Luckily some I would save to disk.  I have tried my best to find references and credit the artists, archive.org links provided if they are available - This is not always the case.

### License 

This project is compromised of the works of artists each with their own licensing, none of THIS projects license are imposed. Copyrights and original licenses are preserved respectively. The reason for this is a lot of the works are published online under MIT license, ie. <a href="https://blog.codepen.io/documentation/licensing/#:~:text=The%20gist%20of%20it%20is,it%20is%20subject%20to%20removal">Code Pen</a> which is permissive and expects an equally permissive license. However other works are not as permissive, or unlicensed. For this reason, code solely belonging to this repo (bg-animation.js) uses CC BY-NC 4.0 Deed Attribution-NonCommercial 4.0 International which prevents commercial use and works themselves have licenses preserved. 

### Todo

#### UX

- Iframe transitions 
- Create a basic background previewer site (better than EXTENDED.md)  
- Slow down fast moving bgs (in progress)
- Add redraw, allows you to repain the iframe within duration period.

#### Programmability / Extensibility

Runtime interaction:
 -  Allow basic interaction by exposing an API/function. Play, stop, start, track change (Done, but not mature)
 -  Global postMessage listener (Considering) 
 -  Add ability for Iframe/package to interact with Lovelace Card (Considering)

Programmability interaction: 

 -  Add env variables within Iframe (Done) 
 -  Add env variables to Iframe via card config  

####  Security

  - "Official bg packages" vs "Community packages" via YAML tagging
  - Provide a list of vetted libraries or CDNs
- Provide a way to add libraries in a trusted manner (Done, docs incoming)
- Add video background package  
- Default gallery to use all, if nothing is specified. (Removed)

#### Misc

- Add video background package  
- Add image background package with nice transitions
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
