# Package Development Guide

This document outlines how to create packages for the Lovelace Background Animations.

## Package Structure

A package/folder consists of two main components:
1. A package manifest (package.yaml)
2. Supporting assets (JavaScript, CSS, images, etc.)

Firstly, why? To support parameters and a host of other features, we needed more than just plain HTML files, we needed some basic structure.

## Package Manifest Reference

### Basic Structure
```yaml
version: v1
metadata:
  name: Package Name 
  description: Package description
  author: Author Name
  source: Source URL

helpers:
  insert_baseurl: true    # Automatically inserts base URL in HTML head

parameters:
  - name: parameterName   # Parameter identifier
    default: defaultValue # Default value
    description: Some text for the docs generator     # Parameter description
    type: string|number|boolean|array
    behavior: environment # Makes parameter available as window.env[parameterName]
    enum: []             # Optional array of allowed values
```

## Supported Parameters

The following parameter types and options are supported:

### Basic Types
- string: Text values
- number: Numeric values
- boolean: true/false values
- array: Lists of values
- object: Complex structured data

### Parameter Properties
- name: Parameter identifier
- default: Default value
- description: Parameter description
- type: Data type
- behavior: Parameter behavior (environment)
- enum: Array of allowed values
- schema: Schema for complex types

### Environment Parameters
When behavior is set to 'environment', parameters are accessible in the iframe via:
```javascript
window.env.parameterName
```

## Template Variables

### 1. Compile Variables
```
{{compile:identifier}}
```
Used for injecting compiled content like SCSS

### 2. Parameter Variables
```
{{parameter:parameterName}}
{{param:parameterName}}
{{parameters:parameterName}}
```
Injects parameter values from configuration

### 3. Metadata Variables  
```
{{metadata:field}}
{{meta:field}}
```
Injects package metadata fields

### 4. Environment Variables
```
{{environment:variable}} 
{{env:variable}}
```
Injects environment variables

### 5. Common Resources
```
{{common:resourceUrl}}
```
Injects URLs for common shared resources

## Environment Object Reference

The following properties are available in window.env:

```javascript
window.env = {
  lovelaceUI: {}, // Lovelace UI DOM elements and config
  basePath: '',   // Package assets path 
  commonPath: '', // Common resources path
  rootPath: '',   // Gallery root path
  assetPath: '',  // Alias for basePath
  packageManifest: {}, // Full package manifest
  packageConfig: {},   // Package configuration
  // All parameters with behavior: 'environment'
}
```

## Undocumented Features

### Package Redraw
Packages can request a redraw by setting redraw in milliseconds:
```yaml
- id: animation.example
  redraw: 5000  # Redraws iframe every 5 seconds
```

### Per-Item Transitions
Individual items can override global transitions:
```yaml
- id: animation.example
  transition: fade-to-black
```

### Conditional Loading
Packages can be conditionally loaded based on:
```yaml
conditions:
  include_users: [user1, user2]
  exclude_users: [user3]
  include_devices: [device1] 
  exclude_devices: [device2]
```

### Cache Control
Control caching per package:
```yaml
- id: animation.example
  cache: false
```

## Best Practices

1. Asset Loading
- Use relative paths with {{basePath}}
- Preload critical resources
- Optimize asset sizes

2. Performance
- Minimize DOM operations
- Use requestAnimationFrame for animations
- Optimize canvas operations
- Clean up resources when package is unloaded

3. Security
- Validate user input
- Use Content Security Policy
- Avoid eval() and inline scripts
- Follow same-origin policy

4. Compatibility  
- Test on different browsers
- Support various screen sizes
- Handle errors gracefully
- Provide fallback content

## Package Submission

Submit packages with:

1. package.yaml
2. Preview image/video
3. All required assets
4. Documentation of:
   - Parameters
   - Requirements
   - Usage examples

## Parameter Reference Guide

### Basic Parameter Types

#### String Parameters
```yaml
parameters:
  - name: textColor
    type: string
    default: "#FF0000"
    description: "Color in hex format"
    behavior: environment  # Makes available as window.env.textColor
    enum: ["#FF0000", "#00FF00", "#0000FF"]  # Optional allowed values
```

#### Number Parameters
```yaml
parameters:
  - name: particleCount
    type: number
    default: 1000
    description: "Number of particles to render"
    behavior: environment
    min: 100          # Optional minimum value
    max: 5000         # Optional maximum value
    step: 100         # Optional step value
```

#### Boolean Parameters
```yaml
parameters:
  - name: showControls
    type: boolean
    default: true
    description: "Show or hide control panel"
    behavior: environment
```

#### Array Parameters
```yaml
parameters:
  - name: colorList
    type: array
    default: ["#FF0000", "#00FF00", "#0000FF"]
    description: "List of colors to use"
    behavior: environment
```

### Using Parameters in Templates

#### In HTML
```html
<div style="background-color: {{parameter:backgroundColor}}">
  <canvas id="particleCanvas" data-count="{{parameter:particleCount}}"></canvas>
  {{#if parameter:showControls}}
    <div class="controls">...</div>
  {{/if}}
</div>
```

#### In JavaScript
```html
<script>
  // Access via window.env
  const config = {
    backgroundColor: window.env.backgroundColor,
    particleCount: window.env.particleCount,
    showControls: window.env.showControls
  };

  // Using complex object parameters
  const { size, speed, color } = window.env.particleSettings;
  
  // Using array parameters
  window.env.waypoints.forEach(point => {
    drawPoint(point.x, point.y, point.speed);
  });
</script>
```

#### In SCSS Compilation
```yaml
compile:
  - id: styles
    scss: |
      $primary-color: {{parameter:backgroundColor}};
      $show-controls: {{parameter:showControls}};
      
      .container {
        background: $primary-color;
        .controls {
          display: if($show-controls, block, none);
        }
      }
```

### Parameter Behavior Types

#### Environment Parameters
Makes parameter accessible in iframe's window.env:
```javascript
// Access in JavaScript
const color = window.env.backgroundColor;
const settings = window.env.particleSettings;
```

#### Template Parameters
Only available in template substitution:
```html
<div style="color: {{parameter:textColor}}">
  {{parameter:content}}
</div>
```

### Best Practices for Parameters

1. **Default Values**
   - Always provide sensible defaults
   - Use appropriate types for values
   - Consider edge cases

2. **Validation**
   - Add min/max for numbers
   - Use patterns for strings
   - Validate array lengths
   - Schema for complex objects

3. **Documentation**
   - Clear descriptions
   - Example values
   - Usage instructions
   - Required vs optional

4. **Performance**
   - Limit array sizes
   - Cache computed values
   - Optimize object access
