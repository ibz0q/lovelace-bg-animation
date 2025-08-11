# Lovelace Background Animations 

Replace Home Assistant's background with an animation! 

Preview animations here: https://ibz0q.github.io/lovelace-bg-animation/ or [docs/EXTENDED.md](https://github.com/ibz0q/lovelace-bg-animation/blob/main/docs/EXTENDED.md)


**Current Release: v1.1.4**

<p align="center">

[<img src="https://i.imgur.com/PLlO4cA.gif">](https://i.imgur.com/f3hLlRu.mp4)
</p>

 
## 🎀 Tributes (Artists featured)

 - Jack Rugile (13)
 - Ben Matthews (8)
 - Dillon (6)
 - Alex Andrix (5)
 - Bas Groothedde (5)
 - Matei Copot (5)
 - Ibz (4)
 - Boris Šehovac (4)
 - Scott Weaver (2)
 - Kevin Levron (2)
 - Akimitsu Hamamuro (2)
 - AzazelN28 (1)
 - Liam Egan (1)
 - Lanny (1)
 - Matthias Hurrle (1)
 - Karl Saunders (1)
 - Ray Victor PRO (1)
 - tympanus (1)
 - Griffin Moyer (1)
 - Yuki (1)
 - Original Author (1)
 - yoichi kobayashi (1)
 - nskrgv (1)
 - Nathan Gordon (1)
 - Jared Stanley (1)
 - Ksenia Kondrashova (1)
 - Ana Tudor (1)
 - MenSeb (1)
 - Júlia Erő (1)
 - DanDog (1)
 - Tim Severien (1)
 - cssscript.com (1)
 - Takeshi Kano (1)
 - Andreas Wilcox (1)
 - alphardex (1)
 - Home Assistant Team (1)
 - Sarah Drasner (1)
 - Fabio Ottaviani (1)

### 🙏 Contributors

 - [Sjors Kaagman](https://github.com/SjorsMaster) (2)


### Install with HACS 

Search "Live Background Animations" in HACS and Install.

### Install manually

Download latest release zip. Extract `dist` into a new folder inside www: homeassistant\config\www\lovelace-background-animation ***e.g.***
```
homeassistant\config\www\lovelace-background-animation\
homeassistant\config\www\lovelace-background-animation\dist\
homeassistant\config\www\lovelace-background-animation\dist\bg-animation.min.js
...
```

Go to Lovelace dashboard: Edit -> Manage Resources -> Add resource -> URL: /local/lovelace-bg-animation/dist/bg-animation.min.js -> Javascript Module and click Create.

--- 

A config needs to be placed inside Lovelaces config file, you can do this inside the Lovelace UI > Edit mode > Raw Configuration Editor.

### Starter configuration

```yaml
bg-animation:
  duration: 60000 # Global duration of each bg (millisecondns) 
  transparency:
    header:
      enable: true
  background:
    global: 
      - id: animation.88.fish-tank
      - id: animation.64.howls-moving-castle
      - id: animation.17.ribbons
      - id: animation.63.green-circuit
      - id: animation.58.browniandrix-noise-l3
      - id: animation.53.stars
      - id: animation.50.sidelined
```
### Configuration options (Advanced)
` * = Optional `

```yaml
bg-animation: 
  duration: 50000 # * Global duration of each bg (millisecondns) 
  loadTimeout: 5000 # * BGs are shown once loaded but forced to be displayed after this timeout
  cache: true # * Default is true, speeds up processing slightly  
  conditions: # *
    regex_device_map: 
       iPhone12ProMax: # Name your your device
         -  AppleWebKit.*12PROMAX.* # Array of regex patterns that match the devices user-agent
       FullKioskBrowserHallway:
         -  .*FullyKioskBrowserHallway.*
  transition: # *
    enable: true
    duration: 1000 # Transition duration in milliseconds
  parentStyle: "position: fixed; right: 0; top: 0; min-width: 100vw; min-height: 100vh; z-index: -10;" # * Root container style
  transparency: # *
    header:
      enable: true # Enable header transparency
      style: ".header {background: transparent !important;}" # Custom header style
    sidebar:
      enable: false # Enable sidebar transparency
      style: "background: transparent !important;" # Custom sidebar style
  gallery: # *
    type: "remote" # Type of gallery: "local" | "remote"
    localRootPath: "/local/lovelace-bg-animation/dist" # Local gallery root path
    manifestFileName: "gallery.manifest" # Gallery manifest filename
    remoteRootUrl: "https://ibz0q.github.io/lovelace-bg-animation" # Remote gallery URL
  sort: "random" # * Order backgrounds will be displayed: "random" | "reverse" | "id_asc" | "id_desc"
  background:
    global: # Global bgs are applied to all views, unless there is one specified below 
      - id: animation.11.space # Background id
        style: "min-width: 100vw; min-height: 100vh; border:0; overflow: hidden;" # * Custom iframe style
        cache: true # * Enable caching for this background
        duration: false # * Override global duration
        redraw: 5000 # * Redraws the iframe - must be above 500 ms otherwise ignored.
        conditions: # *
          include_users: [username1, username2] # Only show for these users
          exclude_users: [username3] # Don't show for these users
          include_devices: [device1] # Only show on these devices
          exclude_devices: [device2] # Don't show on these devices
    view: # View-specific background settings http://homeassistant/lovelace/lights becomes "lights"
      lights: # 'lights' view
        - id: animation.11.space # Background id
          duration: 40000
          manifestOverride: # Overrides any package values 
            helpers:
              insert_baseurl: false
          conditions: # *
            exclude_users: [ibz] # Exclude these HA users
            exclude_devices: [iPhone12ProMax] # Exclude this device key (from conditions)
        - id: animation.15.sound 
      gruffalo: # e.g. http://homeassistant/lovelace/gruffalo - "gruffalo" etc
        - id: animation.11.space # Background ID
          duration: 40000
        - id: application.1.media-background
          parameters:
            mediaList:
              - file: /images/somefile.png
                duration: 5000
                preload: auto
                stretchToFit: true
                muted: true
          duration: 40000 
```

There's also a card that let's you control bg's:

![alt text](docs/card.png)

```YAML
type: custom:lovelace-bg-animation
```

## Contributions

PRs need to be attached to an issue that contains the following info:

- Image Preview
- name: description: author: source: 
- Does the package contain any of the following?
  - Javascript,
  -  Uncompiled code like pug, scss
- Have you audited the code yourself?

 
## Why

Lot's of pretty animations existed at the dawn of HTML5/Canvas/JS/CSS3/Flash and there's artists still creating these thesetoday. I wanted to curate old and new, use them on my Home Assistant tablet/dashboard, they look cool.

Unfortunately over time some older animations were lost to digital oblivion. I sometimes saved these locally and have tried to repair them to original to the best of my ability and credit the original artists, archive.org links provided if they are available - This is not always the case.

### License 

This project is compromised of the works of artists each with their own licensing, none of THIS projects license are imposed. Copyrights and original licenses are preserved respectively. The reason for this is a lot of the works are published online under MIT license, ie. <a href="https://blog.codepen.io/documentation/licensing/#:~:text=The%20gist%20of%20it%20is,it%20is%20subject%20to%20removal">Code Pen</a> which is permissive and expects an equally permissive license or some were created at a time when licensing wasn't really a thing on the web. In some cases works aren't as permissive, or unlicensed. For this reason, code solely belonging to this repo (bg-animation.js) uses CC BY-NC 4.0 Deed Attribution-NonCommercial 4.0 International which prevents commercial use and works themselves have licenses preserved. 

## To do

- UX

  - Transparent Overlays

- Extensibility

  -  Global postMessage listener (Considering) 
  -  Add ability for Iframe/package to interact with Lovelace Card (Considering)

- Security

  - Provide a list of vetted libraries or CDNs
  - Provide a way to add libraries in a trusted manner (Done, docs incoming)
  - Add video background package  
  - Default gallery to use all, if nothing is specified. (Removed)

