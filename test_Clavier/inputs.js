         o3djs.require('o3djs.util');
         o3djs.require('o3djs.math');
         o3djs.require('o3djs.rendergraph');
         o3djs.require('o3djs.canvas');
         o3djs.require('o3djs.simple');

         // Events
         // Run the init() function once the page has finished loading.
         // Run the uninit() function when the page has is unloaded.
         window.onload = init;
         window.onunload = uninit;

         // global variables
         var g_o3d;
         var g_math;
         var g_client;
         var g_pack;
         var g_clock = 0;
         var g_timeMult = 1;
         var g_cubeTransform;
         var g_textCanvas;
         var g_paint;
         var g_canvasLib;
         var g_3dRoot;
         var g_hudRoot;
         var g_viewInfo;
         var g_hudViewInfo;
         var g_keyPressDelta = 0.05;
         var sphereShape;

         function createSphere(material) {
        	sphereShape = g_pack.createObject('Chuchu');
        	sphereShape = o3djs.primitives.createSphere(g_pack,material, 1,30,10);
            return sphereShape;
         }

         function drawText(str) {
           // Clear to completely transparent.
           g_textCanvas.canvas.clear([0.5, 0.5, 0.5, 0.5]);

           // Reuse the global paint object
           var paint = g_paint;
           paint.color = [1, 1, 1, 1];
           paint.textSize = 12;
           paint.textTypeface = 'Comic Sans MS';
           paint.textAlign = g_o3d.CanvasPaint.LEFT;
           paint.shader = null;
           g_textCanvas.canvas.drawText(str, 10, 30, paint);

           g_textCanvas.updateTexture();
        }         

         /**
          * This method gets called every time O3D renders a frame.  Here's
          * where we update the cube's transform to make it spin.
          * @param {o3d.RenderEvent} renderEvent The render event object that
          * gives us the elapsed time since the last time a frame was rendered.
          */
         function renderCallback(renderEvent) {
           g_clock += renderEvent.elapsedTime * g_timeMult;
           //drawText("Hello world - " + (Math.round(g_clock * 100) / 100) + "s");
         }

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

               g_3dRoot.localMatrix =
                   g_math.matrix4.mul(g_3dRoot.localMatrix,
                                      g_math.matrix4.rotationY(-delta));
               actionTaken = true;
               break;
             case 'd':
               g_3dRoot.localMatrix =
                   g_math.matrix4.mul(g_3dRoot.localMatrix,
                                      g_math.matrix4.rotationY(delta));
               actionTaken = true;
               break;
             case 'w':
               g_3dRoot.localMatrix =
                   g_math.matrix4.mul(g_3dRoot.localMatrix,
                                      g_math.matrix4.rotationX(-delta));
               actionTaken = true;
               break;
             case 's':
               g_3dRoot.localMatrix =
                   g_math.matrix4.mul(g_3dRoot.localMatrix,
                                      g_math.matrix4.rotationX(delta));
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

           if (keyPressedAction(keyChar, g_keyPressDelta)) {
             o3djs.event.cancel(event);
           }
         }         

         /**
          * Creates the client area.
          */
         function init() {
           o3djs.util.makeClients(initStep2);
         }

         /**
          * Initializes O3D.
          * @param {Array} clientElements Array of o3d object elements.
          */
         function initStep2(clientElements) {
           // Initializes global variables and libraries.
           var o3dElement = clientElements[0];
           g_client = o3dElement.client;
           g_o3d = o3dElement.o3d;
           g_math = o3djs.math;

           // Initialize O3D sample libraries.
           o3djs.base.init(o3dElement);

           // Create a pack to manage the objects created.
           g_pack = g_client.createPack();

           // Create 2 root transforms, one for the 3d parts and 2d parts.
           // This is not strictly neccassary but it is helpful.
           g_3dRoot = g_pack.createObject('Transform');
           g_hudRoot = g_pack.createObject('Transform');

           // Create the render graph for a view.
           g_viewInfo = o3djs.rendergraph.createBasicView(
               g_pack,
               g_3dRoot,
               g_client.renderGraphRoot);

           // Set the background color to black.
           g_viewInfo.clearBuffer.clearColor = [0, 0, 0, 1];

           // Create a second view for the hud.
           g_hudViewInfo = o3djs.rendergraph.createBasicView(
                g_pack,
                g_hudRoot,
                g_client.renderGraphRoot);

           // Make sure the hud gets drawn after the 3d stuff
           g_hudViewInfo.root.priority = g_viewInfo.root.priority + 1;

           // Turn off clearing the color for the hud since that would erase the
           // 3d parts but leave clearing the depth and stencil so the HUD is
           //  unaffected by anything done by the 3d parts.
           g_hudViewInfo.clearBuffer.clearColorFlag = false;

           // Set up a perspective view
           g_viewInfo.drawContext.projection = g_math.matrix4.perspective(
               g_math.degToRad(30), // 30 degree fov.
               g_client.width / g_client.height,
               1,                  // Near plane.
               5000);              // Far plane.

           // Set up our view transformation to look towards the world origin
           // where the cube is located.
           g_viewInfo.drawContext.view = g_math.matrix4.lookAt([0, 1, 5], //eye
                                                     [0, 0, 0],  // target
                                                     [0, 1, 0]); // up

           //Set up the 2d orthographic view
           g_hudViewInfo.drawContext.projection = g_math.matrix4.orthographic(
              0 + 0.5,
              g_client.width + 0.5,
              g_client.height + 0.5,
              0 + 0.5,
              0.001,
              1000);

           g_hudViewInfo.drawContext.view = g_math.matrix4.lookAt(
              [0, 0, 1],   // eye
              [0, 0, 0],   // target
              [0, 1, 0]);  // up                                                     

           // Create an Effect object and initialize it using the shaders
           // from the text area.
           var redEffect = g_pack.createObject('Effect');
           var shaderString = document.getElementById('effect').value;
           redEffect.loadFromFXString(shaderString);

           // Create a Material for the mesh.
           var redMaterial = g_pack.createObject('Material');

           // Set the material's drawList.
           redMaterial.drawList = g_viewInfo.performanceDrawList;

           // Apply our effect to this material. The effect tells the 3D
           // hardware which shaders to use.
           redMaterial.effect = redEffect;

           // Create the Shape for the cube mesh and assign its material.
           var sphereShape = createSphere(redMaterial);

           // Create a new transform and parent the Shape under it.
           g_cubeTransform = g_pack.createObject('Transform');
           g_cubeTransform.addShape(sphereShape);

           // Parent the cube's transform to the client root.
           g_cubeTransform.parent = g_3dRoot;

           // Generate the draw elements for the cube shape.
           sphereShape.createDrawElements(g_pack, null);

           // Create the global paint object that's used by draw operations.
           g_paint = g_pack.createObject('CanvasPaint');

           // Creates an instance of the canvas utilities library.
           g_canvasLib = o3djs.canvas.create(g_pack, g_hudRoot, g_hudViewInfo);

           // Create a canvas that will be used to display the text.
           g_textCanvas = g_canvasLib.createXYQuad(70, 70, 0, 100, 50, true);
           // Set our render callback for animation.
           // This sets a function to be executed every time frame is rendered.
           g_client.setRenderCallback(renderCallback);

           //Set up a callback to interpret keypresses
           window.document.onkeypress = keyPressedCallback;
         }

         /**
          * Removes callbacks so they aren't called after the page has unloaded.
          */
         function uninit() {
           if (g_client) {
             g_client.cleanup();
           }
         }
