
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
  keyPressDelta   :0.05,
  clock           :0,
  framesRendered  :0,
  timeMult        :1.0,
  sun_size        :50,
  mercury_size    :1.21,
  venus_size	   :3.026,
  earth_size	   :3.18,
  mars_size       :1.6985,
  jupiter_size    :35.75,
  saturne_size    :30.165,	
  uranus_size	   :12.78,
  neptune_size    :12.5,
  pluto_size	   :3.87,
  moon_size       :0.87,
  EARTH_RADIUS    :25,
  ENERGY_WIDTH    :0.5,
  ENERGY_HEIGHT: 45
};
 
g.camera = {
 eye: [0, 50, 400],
 target: [0, 0, 0]
};
 
var g_finished = false;  // for selenium.
var dragging = false;
 

/**
 * Function performing the rotate action in response to a key-press.
 * Rotates the scene based on key pressed. (w ,s, a, d). Note that the
 * x, y-axis referenced here are relative to the current view of scene.
 * @param {keyPressed} The letter pressed, in lower case.
 * @param {delta} The angle by which the scene should be rotated.
 * @return true if an action was taken.
 */
function keyPressedAction(keyPressed, delta) {
  var actionTaken = false;
  switch(keyPressed) {
    case 'a':

      g.rootMain.localMatrix =
          g.math.matrix4.mul(g.rootMain.localMatrix,
                             g.math.matrix4.rotationY(-delta));
      actionTaken = true;
      break;
    case 'd':
    	g.rootMain.localMatrix =
    		g.math.matrix4.mul(g.rootMain.localMatrix,
                             g.math.matrix4.rotationY(delta));
      actionTaken = true;
      break;
    case 'w':
    	g.rootMain.localMatrix =
    		g.math.matrix4.mul(g.rootMain.localMatrix,
                             g.math.matrix4.rotationX(-delta));
      actionTaken = true;
      break;
    case 's':
    	g.rootMain.localMatrix =
    		g.math.matrix4.mul(g.rootMain.localMatrix,
                             g.math.matrix4.rotationX(delta));
      actionTaken = true;
      break;
  }
  return actionTaken;
}

/**
 * Callback for the keypress event.
 * Invokes the action to be performed for the key pressed.
 * @param {event} keyPress event passed to us by javascript.
 */
function keyPressedCallback(event) {
  event = event || window.event;

  // Ignore accelerator key messages.
  if (event.metaKey)
    return;

  var keyChar =String.fromCharCode(o3djs.event.getEventKeyChar(event));
  // Just in case they have capslock on.
  keyChar = keyChar.toLowerCase();

  if (keyPressedAction(keyChar, g.keyPressDelta)) {
    o3djs.event.cancel(event);
  }
}    



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
 
    var m = g.rootMain.localMatrix;
    g.math.matrix4.setUpper3x3(m, g.thisRot);
    g.rootMain.localMatrix = m;
  }
}
 
function stopDragging(e) {
  dragging = false;
}
 
function updateViewFromCamera() {
//  var target = g.camera.target;
//  var eye = g.camera.eye;
  var up = [0, 1, 0];
  g.viewInfo.drawContext.view = g.math.matrix4.lookAt(g.camera.eye, g.camera.target, up);
  g.eyePosParam.value = g.camera.eye;
}
 
function scrollMe(e) {
	  if (e.deltaY) {
		var t = 1;
		if (e.deltaY > 0)
			t = 11 / 12;
		else
			t = 13 / 12;
		g.camera.eye = g.math.lerpVector(g.camera.target, g.camera.eye, t);

		updateViewFromCamera();
	}
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

function createEnergyShape(pack, material, width, height) {
	  var vertexInfo = o3djs.primitives.createVertexInfo();
	  var positionStream = vertexInfo.addStream(
	      3, g.o3d.Stream.POSITION);
	  var normalStream = vertexInfo.addStream(
	      3, g.o3d.Stream.NORMAL);
	  var colorStream = vertexInfo.addStream(
	      4, g.o3d.Stream.COLOR);
	  var texCoordStream = vertexInfo.addStream(
	      2, g.o3d.Stream.TEXCOORD, 0);
	 
	  var vScale = 1;
	  positionStream.addElement(width * -0.5, height, 0);
	  normalStream.addElement(0, 0, 1);
	  colorStream.addElement(1, 1, 1, 0);
	  texCoordStream.addElement(0, 0);
	  positionStream.addElement(width *  0.5, height, 0);
	  normalStream.addElement(0, 0, 1);
	  colorStream.addElement(1, 1, 1, 0);
	  texCoordStream.addElement(1, 0);
	  positionStream.addElement(width * -0.5, 0, 0);
	  normalStream.addElement(0, 0, 1);
	  colorStream.addElement(1, 1, 1, 1);
	  texCoordStream.addElement(0, vScale);
	  positionStream.addElement(width *  0.5, 0, 0);
	  normalStream.addElement(0, 0, 1);
	  colorStream.addElement(1, 1, 1, 1);
	  texCoordStream.addElement(1, vScale);
	  positionStream.addElement(0, height, width * -0.5);
	  normalStream.addElement(1, 0, 0);
	  colorStream.addElement(1, 1, 1, 0);
	  texCoordStream.addElement(0, 0);
	  positionStream.addElement(0, height, width *  0.5);
	  normalStream.addElement(1, 0, 0);
	  colorStream.addElement(1, 1, 1, 0);
	  texCoordStream.addElement(1, 0);
	  positionStream.addElement(0, 0, width * -0.5);
	  normalStream.addElement(1, 0, 0);
	  colorStream.addElement(1, 1, 1, 1);
	  texCoordStream.addElement(0, vScale);
	  positionStream.addElement(0, 0, width *  0.5);
	  normalStream.addElement(1, 0, 0);
	  colorStream.addElement(1, 1, 1, 1);
	  texCoordStream.addElement(1, vScale);
	 
	  vertexInfo.addTriangle(0, 1, 2);
	  vertexInfo.addTriangle(1, 2, 3);
	  vertexInfo.addTriangle(4, 5, 6);
	  vertexInfo.addTriangle(5, 6, 7);
	 
	  return vertexInfo.createShape(pack, material);
	}
 
//A geo is a float where the integer part is in degrees and the fractional
//part is in 60ths
function geoToRad(geo) {
	var sign = geo >= 0 ? 1 : -1;
	geo = Math.abs(geo);
	var integerPart = Math.floor(geo);
	var fractionalPart = (geo % 1) * 100;
	fractionalPart = fractionalPart / 60;
	return g.math.degToRad(integerPart + fractionalPart);
}

function addEnergyShard(latitude, longitude, energy, height, color) {
	  var transform = g.pack.createObject('Transform');
	  transform.rotateZ(geoToRad(latitude));
	  transform.rotateY(geoToRad(-longitude));
	  transform.rotateZ(g.math.degToRad(90));
	  transform.translate(0, g.EARTH_RADIUS, 0);
	  transform.parent = g.root;
	  transform.addShape(g.energyShape);
	  transform.createParam('colorMult', 'ParamFloat4').value = color;
	  transform.createParam('offset', 'ParamFloat').value = Math.random();
	  return transform;
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
  //g.client.setRenderCallback(onRender);
 
 
  // Create Materials.
  var effectNames = [
    "noTexture",
    "dayOnly",
    "dayOnlyEarth",
    "dayOnlySun",
    "dayOnlyMoon",
    "dayOnlyMercury",
    "dayOnlyVenus",
    "dayOnlyMars",
    "dayOnlyJupiter",
    "dayOnlySaturne",
    "dayOnlyUranus",
    "dayOnlyNeptune",
    "dayOnlyPluto",
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
  g.dayOnlyMaterialMercury 	= g.materials[5];
  g.dayOnlyMaterialVenus 	= g.materials[6];
  g.dayOnlyMaterialMars 	= g.materials[7];
  g.dayOnlyMaterialJupiter 	= g.materials[8];
  g.dayOnlyMaterialSaturne 	= g.materials[9];
  g.dayOnlyMaterialUranus 	= g.materials[10];
  g.dayOnlyMaterialNeptune 	= g.materials[11];
  g.dayOnlyMaterialPluto 	= g.materials[12];
  g.energyMaterial 			= g.materials[15];
  g.energyMaterial.drawList = g.viewInfo.zOrderedDrawList;
  g.atmosphereMaterial 		= g.materials[16];  

  // create samplers
  g.samplers = [];
  for (var ii = 0; ii < g.materials.length; ++ii) {
    var sampler = g.pack.createObject('Sampler');
    g.samplers[ii] = sampler;
  }
 
  g.daySampler = g.samplers[0];
  g.daySamplerEarth = g.samplers[1];
  g.daySamplerSun = g.samplers[2];
  g.daySamplerMoon = g.samplers[3];
  g.daySamplerMercury = g.samplers[4];
  g.daySamplerVenus = g.samplers[5];
  g.daySamplerMars = g.samplers[6];
  g.daySamplerJupiter = g.samplers[7];
  g.daySamplerSaturne = g.samplers[8];
  g.daySamplerUranus = g.samplers[9];
  g.daySamplerNeptune = g.samplers[10];
  g.daySamplerPluto = g.samplers[11];
  
  g.nightSampler = g.samplers[12];
  g.maskSampler = g.samplers[15];
  g.energySampler = g.samplers[14];
 
  // set the material samplers.
  g.dayOnlyMaterial.getParam('daySampler').value = g.daySampler;
  g.dayOnlyMaterialSun.getParam('daySamplerSun').value = g.daySamplerSun;
  g.dayOnlyMaterialEarth.getParam('daySamplerEarth').value = g.daySamplerEarth;
  g.dayOnlyMaterialMoon.getParam('daySamplerMoon').value = g.daySamplerMoon;
  g.dayOnlyMaterialMercury.getParam('daySamplerMercury').value = g.daySamplerMercury;
  g.dayOnlyMaterialVenus.getParam('daySamplerVenus').value = g.daySamplerVenus;
  g.dayOnlyMaterialMars.getParam('daySamplerMars').value = g.daySamplerMars;
  g.dayOnlyMaterialJupiter.getParam('daySamplerJupiter').value = g.daySamplerJupiter;
  g.dayOnlyMaterialSaturne.getParam('daySamplerSaturne').value = g.daySamplerSaturne;
  g.dayOnlyMaterialUranus.getParam('daySamplerUranus').value = g.daySamplerUranus;
  g.dayOnlyMaterialNeptune.getParam('daySamplerNeptune').value = g.daySamplerNeptune;
  g.dayOnlyMaterialPluto.getParam('daySamplerPluto').value = g.daySamplerPluto;
  g.energyMaterial.getParam('energySampler').value = g.energySampler;
  
  
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
  g.shardCounter = g.pack.createObject('SecondCounter');
  g.shardCounter.multiplier = 0.1;
  g.energyMaterial.getParam('time').bind(
      g.shardCounter.getParam('count'));
   g.energyMaterial.getParam('time').bind(
	      g.shardCounter.getParam('count'));
 
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
  g.dayOnlyMaterialMercury.getParam('mix').bind(
	      g.flatToDayCounter.getParam('count'));
  g.dayOnlyMaterialVenus.getParam('mix').bind(
	      g.flatToDayCounter.getParam('count'));
  g.dayOnlyMaterialMars.getParam('mix').bind(
	      g.flatToDayCounter.getParam('count'));
  g.dayOnlyMaterialJupiter.getParam('mix').bind(
	      g.flatToDayCounter.getParam('count'));
  g.dayOnlyMaterialSaturne.getParam('mix').bind(
	      g.flatToDayCounter.getParam('count'));
  g.dayOnlyMaterialUranus.getParam('mix').bind(
	      g.flatToDayCounter.getParam('count'));
  g.dayOnlyMaterialNeptune.getParam('mix').bind(
	      g.flatToDayCounter.getParam('count'));
  g.dayOnlyMaterialPluto.getParam('mix').bind(
	      g.flatToDayCounter.getParam('count'));

  
  g.rootMain = g.pack.createObject('Transform');
  g.rootMain.parent = g.client.root;
      // Create a sphere at the origin for the sun.
  sun = o3djs.primitives.createSphere(g.pack,
                                            g.noTextureMaterial,

                                            g.sun_size,
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
  

	
  g.rootEarth = g.pack.createObject('Transform');
  g.rootEarth.parent = g.rootMain;
   // Create a sphere at the origin for the earth.
  earth = o3djs.primitives.createSphere(g.pack,
                                            g.noTextureMaterial,

                                            g.earth_size,
                                            50,
                                            50,
                                            //g.math.matrix4.translation([50, 0, 0]));
											g.math.matrix4.translation([0, 0, 0]));
  // Get a the element so we can set its material later.
  g.earthPrimitive = earth.elements[0];
  g.earth = g.pack.createObject('Transform');
  g.earth.addShape(earth);
  g.earth.parent = g.rootEarth;
    // Create a sphere at the origin for the moon.
  moon = o3djs.primitives.createSphere(g.pack,
                                            g.noTextureMaterial,

                                            g.moon_size,
                                            50,
                                            50,
                                            g.math.matrix4.translation([g.earth_size+2, 0, 0]));
											//g.math.matrix4.translation([0, 0, 0]));
    // Get a the element so we can set its material later.
  g.moonPrimitive = moon.elements[0];
  //ajout root moon
  g.rootmoon = g.pack.createObject('Transform');
  g.rootmoon.parent = g.earth;
  //
  g.moon = g.pack.createObject('Transform');
  g.moon.addShape(moon);
  g.moon.parent = g.rootmoon;

  g.rootMercury = g.pack.createObject('Transform');
  g.rootMercury.parent = g.rootMain;
  // Create a sphere at the origin for the moon.
  mercury = o3djs.primitives.createSphere(g.pack,
                                            g.noTextureMaterial,

                                            g.mercury_size,
                                            50,
                                            50,
                                            g.math.matrix4.translation([0, 0, 0]));
											//g.math.matrix4.translation([0, 0, 0]));
    // Get a the element so we can set its material later.
  g.mercuryPrimitive = mercury.elements[0];
  g.mercury = g.pack.createObject('Transform');
  g.mercury.addShape(mercury);
  g.mercury.parent = g.rootMercury;

  g.rootVenus = g.pack.createObject('Transform');
  g.rootVenus.parent = g.rootMain;
  // Create a sphere at the origin for the venus.
  venus = o3djs.primitives.createSphere(g.pack,
                                            g.noTextureMaterial,

                                           g.venus_size,
                                            50,
                                            50,
                                            g.math.matrix4.translation([0, 0, 0]));
											//g.math.matrix4.translation([0, 0, 0]));
    // Get a the element so we can set its material later.
  g.venusPrimitive = venus.elements[0];
  g.venus = g.pack.createObject('Transform');
  g.venus.addShape(venus);
  g.venus.parent = g.rootVenus;

  g.rootMars = g.pack.createObject('Transform');
  g.rootMars.parent = g.rootMain;
  // Create a sphere at the origin for the mars.
  mars = o3djs.primitives.createSphere(g.pack,
                                            g.noTextureMaterial,

                                            g.mars_size,
                                            50,
                                            50,
                                            g.math.matrix4.translation([0, 0, 0]));
											//g.math.matrix4.translation([0, 0, 0]));
    // Get a the element so we can set its material later.
  g.marsPrimitive = mars.elements[0];
  g.mars = g.pack.createObject('Transform');
  g.mars.addShape(mars);
  g.mars.parent = g.rootMars;

  g.rootJupiter = g.pack.createObject('Transform');
  g.rootJupiter.parent = g.rootMain;
  // Create a sphere at the origin for the jupiter.
  jupiter = o3djs.primitives.createSphere(g.pack,
                                            g.noTextureMaterial,

                                            g.jupiter_size,
                                            50,
                                            50,
                                            g.math.matrix4.translation([0, 0, 0]));
											//g.math.matrix4.translation([0, 0, 0]));
    // Get a the element so we can set its material later.
  g.jupiterPrimitive = jupiter.elements[0];
  g.jupiter = g.pack.createObject('Transform');
  g.jupiter.addShape(jupiter);
  g.jupiter.parent = g.rootJupiter;
  
  g.rootSaturne = g.pack.createObject('Transform');
  g.rootSaturne.parent = g.rootMain;
  // Create a sphere at the origin for the saturne.
  saturne = o3djs.primitives.createSphere(g.pack,
                                            g.noTextureMaterial,

                                            g.saturne_size,
                                            50,
                                            50,
                                            g.math.matrix4.translation([0, 0, 0]));
											//g.math.matrix4.translation([0, 0, 0]));
    // Get a the element so we can set its material later.
  g.saturnePrimitive = saturne.elements[0];
  g.saturne = g.pack.createObject('Transform');
  g.saturne.addShape(saturne);
  g.saturne.parent = g.rootSaturne;

  g.rootUranus = g.pack.createObject('Transform');
  g.rootUranus.parent = g.rootMain;
  // Create a sphere at the origin for the uranus.
  uranus = o3djs.primitives.createSphere(g.pack,
                                            g.noTextureMaterial,

                                            g.uranus_size,
                                            50,
                                            50,
                                            g.math.matrix4.translation([0, 0, 0]));
											//g.math.matrix4.translation([0, 0, 0]));
    // Get a the element so we can set its material later.
  g.uranusPrimitive = uranus.elements[0];
  g.uranus = g.pack.createObject('Transform');
  g.uranus.addShape(uranus);
  g.uranus.parent = g.rootUranus;

  g.rootNeptune = g.pack.createObject('Transform');
  g.rootNeptune.parent = g.rootMain;
  // Create a sphere at the origin for the neptune.
  neptune = o3djs.primitives.createSphere(g.pack,
                                            g.noTextureMaterial,

                                            g.neptune_size,
                                            50,
                                            50,
                                            g.math.matrix4.translation([0, 0, 0]));
											//g.math.matrix4.translation([0, 0, 0]));
  // Get a the element so we can set its material later.
  g.neptunePrimitive = neptune.elements[0];
  g.neptune = g.pack.createObject('Transform');
  g.neptune.addShape(neptune);
  g.neptune.parent = g.rootNeptune;

  g.rootPluto = g.pack.createObject('Transform');
  g.rootPluto.parent = g.rootMain;
  // Create a sphere at the origin for the pluto.
  pluto = o3djs.primitives.createSphere(g.pack,
                                            g.noTextureMaterial,

                                            g.pluto_size,
                                            50,
                                            50,
                                            g.math.matrix4.translation([0, 0, 0]));
											//g.math.matrix4.translation([0, 0, 0]));
    // Get a the element so we can set its material later.
  g.plutoPrimitive = pluto.elements[0];
  g.pluto = g.pack.createObject('Transform');
  g.pluto.addShape(pluto);
  g.pluto.parent = g.rootPluto;
  
  updateViewFromCamera();

	g.energyShape = createEnergyShape(g.pack, g.energyMaterial, g.ENERGY_WIDTH,
			g.ENERGY_HEIGHT);

	addEnergyShard(0, 0, 1, 1, [ 1, 1, 1, 1 ]);

	// Honolulu, Hawaii, 21, 18, 157, 50
	addEnergyShard(21.18, 157.50, 1, 1, [ 0, 1, 0, 1 ]);
	// San Francisco, Calif. 37 47 122 26
	addEnergyShard(37.47, 122.26, 1, 1, [ 1, 0.5, 0.5, 1 ]);

	for ( var ii = 0; ii < 24; ++ii) {
		var longitude = Math.random() * 360;
		var latitude = Math.random() * 360 - 180;
		var color = [ Math.random() * 0.5 + 0.2, Math.random() * 0.5 + 0.2,
				Math.random() * 0.5 + 0.2, 1 ];
		for ( var jj = 0; jj < 24; ++jj) {
			addEnergyShard(latitude + (Math.random() - 0.5) * 10, longitude
					+ (Math.random() - 0.5) * 10, 1, 1, color);
		}
	}
	

	g.atmosphereState = g.pack.createObject('State');
	g.atmosphereState.getStateParam('AlphaBlendEnable').value = true;
	g.atmosphereState.getStateParam('SourceBlendFunction').value = g.o3d.State.BLENDFUNC_SOURCE_ALPHA;
	g.atmosphereState.getStateParam('DestinationBlendFunction').value = g.o3d.State.BLENDFUNC_INVERSE_SOURCE_ALPHA;
	g.atmosphereState.getStateParam('ZWriteEnable').value = false;
	g.atmosphereMaterial.state = g.atmosphereState;

	// Create a sphere at the origin for the atmosphere.
	var atmosphere = o3djs.primitives.createSphere(g.pack,
			g.atmosphereMaterial, 26, 50, 50);
	g.atmospherePrimitive = atmosphere.elements[0];
	g.atmospherePrimitive.priority = 1;
	g.atmosphere = g.pack.createObject('Transform');
	g.atmosphere.addShape(atmosphere);
	g.atmosphere.parent = g.root;
	  
  updateViewFromCamera();
  
  o3djs.event.addEventListener(g.o3dElement, 'mousedown', startDragging);
  o3djs.event.addEventListener(g.o3dElement, 'mousemove', drag);
  o3djs.event.addEventListener(g.o3dElement, 'mouseup', stopDragging);
  o3djs.event.addEventListener(g.o3dElement, 'wheel', scrollMe);

  loadDayTextureSun();
  loadDayTextureEarth();
  loadDayTextureMoon();
  loadDayTextureMercury();
  loadDayTextureVenus();
  loadDayTextureMars();
  loadDayTextureJupiter();
  loadDayTextureSaturne();
  loadDayTextureUranus();
  loadDayTextureNeptune();
  loadDayTexturePluto();
      
  //debug
  g_debugHelper = o3djs.debug.createDebugHelper(g.client.createPack(),
                                                g.viewInfo);
   
  //g_debugHelper.removeAxis(g.client.root);
  //g_debugHelper.addAxes(g.moon);
  
  //placement des planetes
  g.mercury.translate([49,0,42]);
  g.venus.translate([70.95,0,30]);
  g.earth.translate([35.33,0,-80]);
  g.mars.translate([-71.42,0,-70]);
  g.jupiter.translate([-125,0,210]);
  g.saturne.translate([320,0,250]);
  g.uranus.translate([484,0,-600]);
  g.neptune.translate([-840,0,600]);
  g.pluto.translate([845,0,-600]); 


  //Set up a callback to interpret keypresses
  window.document.onkeypress = keyPressedCallback;
  updateViewFromCamera();

  // Setup an onrender callback for animation.
  g.client.setRenderCallback(onrender);

}

// spin the camera.
function onrender(renderEvent) {
  setClientSize();
  g.framesRendered++;
  // Get the number of seconds since the last render.
  var elapsedTime = renderEvent.elapsedTime;
  g.clock += elapsedTime * g.timeMult;
  var x = Math.sin(g.clock * 0.1) * 100;
  var z = Math.cos(g.clock * 0.1) * 100;
  var y = 1;
  //var r = Math.sin(0.001);
  
  const r = 0.02;	//rotation planete-soleil
  const tr = 0.01; //rotation planete sur elle meme
  g.rootMercury.rotateY(r*1);
  	g.mercury.rotateY(tr*0.01);	
  g.rootVenus.rotateY(r*0.38);
  	g.venus.rotateY(tr*0.0041);	
  g.rootEarth.rotateY(r*0.24*1);
  	g.earth.rotateY(tr*1);	//faire tourner la terre sur elle-m�me
    g.rootmoon.rotateY(0.02);	//faire tourner la lune autour de la terre
  g.rootMars.rotateY(r*0.12);
  	g.mars.rotateY(tr*0.975);	
  g.rootJupiter.rotateY(r*0.02);
  	g.jupiter.rotateY(tr*2.44);	
  g.rootSaturne.rotateY(r*0.008);
  	g.saturne.rotateY(tr*2.251);
  g.rootUranus.rotateY(r*0.00285);
  	g.uranus.rotateY(tr*1.39);	
  g.rootNeptune.rotateY(r*0.00145);
  	g.neptune.rotateY(tr*1.49);	
  g.rootPluto.rotateY(r*0.0009);
  	g.pluto.rotateY(tr*0.156);	

	
// ne pas decomenter: car sinon le scrollMe ne fonctionne pas
//  g.viewInfo.drawContext.view = g.math.matrix4.lookAt(
//	  [100,1,100],
//      //[x, y, z],  // eye
//      [0, 0, 0],  // target
//      [0, 5, 0]); // up
	  
  
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

function loadDayTextureMercury() {
	  loadTexture('textures/mercurymap.jpg', function(texture) {
	      g.daySamplerMercury.texture = texture;
	      g.mercuryPrimitive.material = g.dayOnlyMaterialMercury;
	      g.flatToDayCounter.running = true;
	    });
}

function loadDayTextureVenus() {
	  loadTexture('textures/venusmap.jpg', function(texture) {
	      g.daySamplerVenus.texture = texture;
	      g.venusPrimitive.material = g.dayOnlyMaterialVenus;
	      g.flatToDayCounter.running = true;
	    });
}

function loadDayTextureMars() {
	  loadTexture('textures/mars_1k_color.jpg', function(texture) {
	      g.daySamplerMars.texture = texture;
	      g.marsPrimitive.material = g.dayOnlyMaterialMars;
	      g.flatToDayCounter.running = true;
	    });
}

function loadDayTextureJupiter() {
	  loadTexture('textures/jupitermap.jpg', function(texture) {
	      g.daySamplerJupiter.texture = texture;
	      g.jupiterPrimitive.material = g.dayOnlyMaterialJupiter;
	      g.flatToDayCounter.running = true;
	    });
}

function loadDayTextureSaturne() {
	  loadTexture('textures/saturnmap.jpg', function(texture) {
	      g.daySamplerSaturne.texture = texture;
	      g.saturnePrimitive.material = g.dayOnlyMaterialSaturne;
	      g.flatToDayCounter.running = true;
	    });
}

function loadDayTextureUranus() {
	  loadTexture('textures/uranusmap.jpg', function(texture) {
	      g.daySamplerUranus.texture = texture;
	      g.uranusPrimitive.material = g.dayOnlyMaterialUranus;
	      g.flatToDayCounter.running = true;
	    });
}

function loadDayTextureNeptune() {
	  loadTexture('textures/neptunemap.jpg', function(texture) {
	      g.daySamplerNeptune.texture = texture;
	      g.neptunePrimitive.material = g.dayOnlyMaterialNeptune;
	      g.flatToDayCounter.running = true;
	    });
}

function loadDayTexturePluto() {
	  loadTexture('textures/plutomap1k.jpg', function(texture) {
	      g.daySamplerPluto.texture = texture;
	      g.plutoPrimitive.material = g.dayOnlyMaterialPluto;
	      g.flatToDayCounter.running = true;
	    });
}


function uninit() {
  // TODO: We should clean up any counters that have callbacks here.
  if (g.client) {
    g.client.cleanup();
  }
}
 