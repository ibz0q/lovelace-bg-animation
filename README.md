# Lovelace Background Animation

Current Release: Beta

A small Lovelace plugin that replaces the background with an animated one, various animations available. 

## 🎀 Tribute to the artists 

The repo features the following artists, shout out to them for their incredible pieces of work they've shared on the web. Please support them in anyway you can as without their work this project is made pointless. In order of Gallery items.

 - Matei Copot (6)
 - Ben Matthews (5)
 - Rahul (1)
 - Takeshi Kano (1)
 - Akimitsu Hamamuro (1)
 - cssscript.com (1)
 - alphardex (1)
 - Alex Andrix (1)
 - Andreas Wilcox (1)

### Donations and Tips

Please directly tip the artists you found most inspiring.

## Project Motivation

Nostalgia. there was a time when the web was full of abstract experiments showcasing what possible with canvas/JS or CSS. I wanted to keep that alive and see those experiments on a Home Assistant dashboard.

Known as digital oblivion. Some of the experiments I have saved overtime in my bookmarks have long been lost or forgotten because of the passage of time. Occasionally I would save these to disk. A number of experiments only exist here now because of this. 

I have tried my best to find references and credit the artists who's original work has been lost to digital oblivion, archive.org links provided if they are available - This is not always the case.

### License 

This project is compromised of the works of various artists each either their own licensing terms, none of this projects license are imposed. Copyrights are preserved respectively. 

For this reason, code belonging to this repo (bg-annimation.js) uses CC BY-NC 4.0 Deed Attribution-NonCommercial 4.0 International.

Code inside Gallery carries the Licenses and Copyrights of their authors respectively. 

## Usage

Minimal config

```yaml
type: custom:lovelace-bg-animation
background:
  - id: 13.ribbons-two
```

All config

```yaml
type: custom:lovelace-bg-animation 
delay: 20000 # Delay in milliseconds between background changes
headerStyle: | # CSS styles for the header
  background: transparent;
gallery: 
  type: local # Specifies the type of gallery, 'local' means the gallery is hosted on the same server
cache: false # Speeds up rendering time, this option disables it globally
style: "css" # Applies CSS to parent root container
sequence: random, shuffle, name_desc, name_asc, id_asc, id_desc, # Specifies the order in which backgrounds are displayed

background: 
  - id: 13.ribbons-two # BG ID
    cache: false # Speeds up rendering time considerably, this option disables it globally
    style: "css" # Applies CSS to the parent container
    redraw: 200000 # Time in milliseconds after which the background is redrawn
    parameters: # Parameters can be passed into a background, depends if author has added support 
      background-image: 222 
```

### Offline only or test your own

Offline was a design decision, by default the plugin connects to this repos Github page. You can override this by using the below.

This will tell the plugin to load everything from Home Assistant only.

It's also useful if you wish to test your own packages.

### The package.yaml 

Everything is self contained inside package.yaml. Instead of embedding plain HTML files I wanted structure and provide a basic templating ability. 

It allows for better offline support for those who use Home Assistant offline only. 

Raw HTML/CSS/JS code can als be generated this way.

### Submitting to gallery

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