
o3djs.require('o3djs.util');
o3djs.require('o3djs.math');
o3djs.require('o3djs.quaternions');
o3djs.require('o3djs.rendergraph');
o3djs.require('o3djs.primitives');
o3djs.require('o3djs.arcball');
o3djs.require('o3djs.io');
o3djs.require('o3djs.debug');
o3djs.require('o3djs.math');
 
var g = {
  clock:0,
  framesRendered:0,
  timeMult:1.0,  
  EARTH_RADIUS: 25,
  ENERGY_WIDTH: 0.5,
  ENERGY_HEIGHT: 10
};
 
g.camera = {
 eye: [0, 0, 75],
 target: [0, 0, 0]
};
 
var g_finished = false;  // for selenium.
var dragging = false;
 
var earth;
var sun; 
var moon; 
var g_math;


var earth_rot;
var root_earth;

function startDragging(e) {
  g.lastRot = g.thisRot;
  g.aball.click([e.x, e.y]);
  dragging = true;
}
 
function drag(e) {
  if (dragging) {
    var rotationQuat = g.aball.drag([e.x, e.y]);
    var rot_mat = g.quaternions.quaternionToRotation(rotationQuat);
    g.thisRot = g.math.matrix4.mul(g.lastRot, rot_mat);
 
    var m = g.root.localMatrix;
    g.math.matrix4.setUpper3x3(m, g.thisRot);
    g.root.localMatrix = m;
  }
}
 
function stopDragging(e) {
  dragging = false;
}
 
function updateViewFromCamera() {
  var target = g.camera.target;
  var eye = g.camera.eye;
  var up = [0, 1, 0];
  g.viewInfo.drawContext.view = g.math.matrix4.lookAt(eye, target, up);
  g.eyePosParam.value = eye;
}
 
function scrollMe(e) {
  if (e.deltaY > 0) {
    g.camera.eye[0] *= 11 / 12;
    g.camera.eye[1] *= 11 / 12;
    g.camera.eye[2] *= 11 / 12;
 
  } else {
    g.camera.eye[0] *= (1 + 1 / 12);
    g.camera.eye[1] *= (1 + 1 / 12);
    g.camera.eye[2] *= (1 + 1 / 12);
  }
  updateViewFromCamera();
}
 
function getURL(path) {
  var base = window.location.href;
  var index = base.lastIndexOf('/');
  base = base.substring(0, index + 1);
  return base + path;
}
 
function setClientSize() {
  var newWidth = g.client.width;
  var newHeight = g.client.height;
 
  if (newWidth != g.o3dWidth || newHeight != g.o3dHeight) {
    g.o3dWidth  = newWidth;
    g.o3dHeight = newHeight;
 
    // Create a perspective projection matrix
    g.viewInfo.drawContext.projection = g.math.matrix4.perspective(
      g.math.degToRad(45), g.o3dWidth / g.o3dHeight, 0.1, 5000);
 
    // Sets a new area size for arcball.
    g.aball.setAreaSize(g.o3dWidth, g.o3dHeight);
  }
}
 
function onRender() {
  setClientSize();
}
 
/**
 * Creates the client area.
 */
function init() {
  o3djs.util.makeClients(initStep2);
}
/**
 * Initializes o3d
 * @param {Array} clientElements Array of o3d object elements.
 */
function initStep2(clientElements) {
  var path = window.location.href;
  var index = path.lastIndexOf('/');
 
  g.o3dElement = clientElements[0];
  g.o3d = g.o3dElement.o3d;
  g.math = o3djs.math;
  g.quaternions = o3djs.quaternions;
  g.client = g.o3dElement.client;
 
  g.pack = g.client.createPack();
 
  // Create the render graph for a view.
  g.viewInfo = o3djs.rendergraph.createBasicView(
      g.pack,
      g.client.root,
      g.client.renderGraphRoot);
 
  // Set the background color to black.
  g.viewInfo.clearBuffer.clearColor = [0, 0, 0, 0];
 
  // Set states for shards.
  g.viewInfo.zOrderedState.getStateParam('CullMode').value =
      g.o3d.State.CULL_NONE;
  g.viewInfo.zOrderedState.getStateParam('DestinationBlendFunction').value =
      g.o3d.State.BLENDFUNC_ONE;
  g.viewInfo.zOrderedState.getStateParam('ZWriteEnable').value = false;
 
  g.viewInfo.performanceDrawPass.sortMethod = g.o3d.DrawList.BY_PRIORITY;
 
  g.lastRot = g.math.matrix4.identity();
  g.thisRot = g.math.matrix4.identity();
 
  var root = g.client.root;
 
  // Create a param for the sun and eye positions that we can bind
  // to auto update a bunch of materials.
  g.globalParams = g.pack.createObject('ParamObject');
  g.sunPosParam = g.globalParams.createParam('sunPos', 'ParamFloat3');
  g.sunPosParam.value = [0, 0, 0];
  g.eyePosParam = g.globalParams.createParam('eyePos', 'ParamFloat3');
 
  updateViewFromCamera();
 
  g.aball = o3djs.arcball.create(100, 100);
  setClientSize();
 
  g.client.setRenderCallback(onRender);
 
 
  // Create Materials.
  var effectNames = [
    "noTexture",
    "dayOnly",
    "dayOnlyEarth",
    "dayOnlySun",
    "dayOnlyMoon",
    "nightAndDay",
    "mask",
    "energy",
    "atmosphere"
    ];
  g.materials = [];
  for (var ii = 0; ii < effectNames.length; ++ii) {
    var effectName = effectNames[ii];
    var effect = g.pack.createObject('Effect');
    effect.loadFromFXString(document.getElementById(effectName).value);
 
    // Create a Material for the effect.
    var material = g.pack.createObject('Material');
 
    // Apply our effect to this material. The effect tells the 3D hardware
    // which shader to use.
    material.effect = effect;
 
    // Set the material's drawList
    material.drawList = g.viewInfo.performanceDrawList;
 
    // This will create the effects's params on the material.
    effect.createUniformParameters(material);
 
	
    // Bind the sun position to a global value so we can easily change it
    // globally.
    var sunParam = material.getParam('sunPos');
    if (sunParam) {
      sunParam.bind(g.sunPosParam);
    }
 
    // Save off the material.
    g.materials.push(material);
  }
  g.noTextureMaterial 		= g.materials[0];
  g.dayOnlyMaterial 		= g.materials[1];
  g.dayOnlyMaterialEarth	= g.materials[2];
  g.dayOnlyMaterialSun 		= g.materials[3];
  g.dayOnlyMaterialMoon 	= g.materials[4];
 
  // create samplers
  g.samplers = [];
  for (var ii = 0; ii < 7; ++ii) {
    var sampler = g.pack.createObject('Sampler');
    g.samplers[ii] = sampler;
  }
 
  g.daySampler = g.samplers[0];
  g.daySamplerEarth = g.samplers[1];
  g.daySamplerSun = g.samplers[2];
  g.daySamplerMoon = g.samplers[3];
  g.nightSampler = g.samplers[4];
  g.maskSampler = g.samplers[5];
  g.energySampler = g.samplers[6];
 
  // set the material samplers.
  g.dayOnlyMaterial.getParam('daySampler').value = g.daySampler;
  g.dayOnlyMaterialSun.getParam('daySamplerSun').value = g.daySamplerSun;
  g.dayOnlyMaterialEarth.getParam('daySamplerEarth').value = g.daySamplerEarth;
  g.dayOnlyMaterialMoon.getParam('daySamplerMoon').value = g.daySamplerMoon;
 
  // Create energy texture(s)
  {
    var dots = [ 0, 1, 0, 1, 0, 0, 1, 0,
                 1, 0, 0, 1, 0, 1, 0, 0,
                 1, 0, 1, 0, 0, 0, 1, 0,
                 0, 1, 0, 1, 0, 0, 1, 0 ];
    var texture = g.pack.createTexture2D(3,
                                         dots.length,
                                         g.o3d.Texture.XRGB8,
                                         1,
                                         false);
    var pixels = [];
    for (var yy = 0; yy < dots.length; ++yy) {
      for (var xx = 0; xx < 3; ++xx) {
        var pixelOffset = (yy * 3 + xx) * 3;
        var color = (xx == 1) ? dots[yy] : 0;
        for (var cc = 0; cc < 3; ++cc) {
          pixels[pixelOffset + cc] = color;
        }
      }
    }
    texture.set(0, pixels);
    g.energySampler.texture = texture;
  }
 
  // Setup counters to fade in textures.
  g.flatToDayCounter = g.pack.createObject('SecondCounter');
  g.flatToDayCounter.end = 1;
  g.flatToDayCounter.multiplier = 0.5;
  g.flatToDayCounter.countMode = g.o3d.Counter.ONCE;
  g.flatToDayCounter.running = false;
  g.dayOnlyMaterial.getParam('mix').bind(
      g.flatToDayCounter.getParam('count'));
  g.dayOnlyMaterialSun.getParam('mix').bind(
      g.flatToDayCounter.getParam('count'));
  g.dayOnlyMaterialEarth.getParam('mix').bind(
      g.flatToDayCounter.getParam('count'));
  g.dayOnlyMaterialMoon.getParam('mix').bind(
      g.flatToDayCounter.getParam('count'));
      
      // Create a sphere at the origin for the sun.
  sun = o3djs.primitives.createSphere(g.pack,
                                            g.noTextureMaterial,
                                            10,
                                            50,
                                            50,
                                            g.math.matrix4.translation([0, 0, 0]));
    // Get a the element so we can set its material later.
  g.sunPrimitive = sun.elements[0];
  g.root = g.pack.createObject('Transform');
  g.root.parent = g.client.root;
  g.sun = g.pack.createObject('Transform');
  g.sun.addShape(sun);
  g.sun.parent = g.root;
  

	
   // Create a sphere at the origin for the earth.
  earth = o3djs.primitives.createSphere(g.pack,
                                            g.noTextureMaterial,
                                            5,
                                            50,
                                            50,
                                            //g.math.matrix4.translation([50, 0, 0]));
											g.math.matrix4.translation([0, 0, 0]));
  // Get a the element so we can set its material later.
  g.earthPrimitive = earth.elements[0];
  g.earth = g.pack.createObject('Transform');
  g.earth.addShape(earth);
  g.earth.parent = g.sun;
    // Create a sphere at the origin for the moon.
  moon = o3djs.primitives.createSphere(g.pack,
                                            g.noTextureMaterial,
                                            2,
                                            50,
                                            50,
                                            g.math.matrix4.translation([10, 0, 0]));
											//g.math.matrix4.translation([0, 0, 0]));
    // Get a the element so we can set its material later.
  g.moonPrimitive = moon.elements[0];
  g.moon = g.pack.createObject('Transform');
  g.moon.addShape(moon);
  g.moon.parent = g.earth;

  o3djs.event.addEventListener(g.o3dElement, 'mousedown', startDragging);
  o3djs.event.addEventListener(g.o3dElement, 'mousemove', drag);
  o3djs.event.addEventListener(g.o3dElement, 'mouseup', stopDragging);
  o3djs.event.addEventListener(g.o3dElement, 'wheel', scrollMe);

  loadDayTextureSun();
  loadDayTextureEarth();
  loadDayTextureMoon();
  
  //debug
  g_debugHelper = o3djs.debug.createDebugHelper(g.client.createPack(),
                                                g.viewInfo);
   
  //g_debugHelper.removeAxis(g.client.root);
  //g_debugHelper.addAxes(g.moon);
  
  //placement des planetes
  g.earth.translate([0,0,80]);
  
   // Setup an onrender callback for animation.
  g.client.setRenderCallback(onrender);
}

// spin the camera.
function onrender(renderEvent) {
  g.framesRendered++;
  // Get the number of seconds since the last render.
  var elapsedTime = renderEvent.elapsedTime;
  g.clock += elapsedTime * g.timeMult;
  var x = Math.sin(g.clock * 0.1) * 100;
  var z = Math.cos(g.clock * 0.1) * 100;
  //var y = Math.sin(g.clock * 0.2) * 100;
  var y = 1;
  var r = Math.sin(0.001);
  g.earth.rotateY(r*1);	//faire tourner la terre sur elle-même
  g.sun.rotateY(r*2);	//faire tourner tout le systeme solaire
  g.moon.rotateY(r*40);	//faire tourner la lune autour de la terre
  g.viewInfo.drawContext.view = g.math.matrix4.lookAt(
	  [100,1,100],
      //[x, y, z],  // eye
      [0, 0, 0],  // target
      [0, 1, 0]); // up
	  
  
}
 
function loadTexture(path, callback) {
  var url = getURL(path);
  o3djs.io.loadTexture(g.pack, url, function(texture, exception) {
      if (exception) {
        alert(exception);
      } else {
        callback(texture);
      }
    });
}
 
function loadDayTextureSun() {
  loadTexture('textures/sunmap.jpg', function(texture) {
      g.daySamplerSun.texture = texture;
      g.sunPrimitive.material = g.dayOnlyMaterialSun;
      g.flatToDayCounter.running = true;
    });
}

function loadDayTextureEarth() {
  loadTexture('textures/earthmap1k.jpg', function(texture) {
      g.daySamplerEarth.texture = texture;
      g.earthPrimitive.material = g.dayOnlyMaterialEarth;
      g.flatToDayCounter.running = true;
    });
}

function loadDayTextureMoon() {
  loadTexture('textures/crate.jpg', function(texture) {
      g.daySamplerMoon.texture = texture;
      g.moonPrimitive.material = g.dayOnlyMaterialMoon;
      g.flatToDayCounter.running = true;
    });
}
 

function uninit() {
  // TODO: We should clean up any counters that have callbacks here.
  if (g.client) {
    g.client.cleanup();
  }
}
 