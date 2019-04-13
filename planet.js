var vertexShaderText =
[
  'precision mediump float;',
  '',
  'attribute vec3 pos;',
  'attribute vec3 norms;',
  'attribute vec2 uvs;',
  '',
  'uniform mat4 World;',
  'uniform mat4 View;',
  'uniform mat4 Proj;',
  '',
  'varying vec3 fragPosition;',
  'varying vec3 fragNormal;',
  'varying vec2 fragUV;',
  '',
  'void main()',
  '{',
  '   fragUV = uvs;',
  '   fragPosition = (World * vec4(pos, 1.0)).xyz;',
  '   fragNormal = (World * vec4(norms, 1.0)).xyz;',
  '   gl_Position = Proj * View * World * vec4(pos, 1.0);',
  '}'
].join('\n');

var fragmentShaderText =
[
  'precision mediump float;',
  '',
  'varying vec3 fragPosition;',
  'varying vec3 fragNormal;',
  'varying vec2 fragUV;',
  '',
  'uniform sampler2D albedoTexture;',
  'uniform sampler2D specularTexture;',
  'uniform sampler2D nightTexture;',
  '',
  'void main()',
  '{',
  '',
  '   vec3 norm = normalize(fragNormal);',
  '   vec3 lightDir = vec3(1, 0, -0.5);',
  '',
  '   float diff = max(dot(norm, lightDir), 0.0);',
  '',
  '   vec3 viewDir = vec3(0, 0.3, -1);',
  '   vec3 reflectDir = reflect(-lightDir, norm);',
  '',
  '   float spec = pow(max(dot(viewDir, reflectDir), 0.0), 8.0);',
  '   vec3 specular = vec3(spec * 0.1);',
  '',
  '   vec4 dayColour = texture2D(albedoTexture, vec2(1.0 - fragUV.x, fragUV.y));',
  '   vec4 nightColour = texture2D(nightTexture, vec2(1.0 - fragUV.x, fragUV.y)) * vec4(1/min(1.0, diff + 0.1));',
  '   vec4 baseColour = mix(nightColour, dayColour, diff);',
  '',
  '   gl_FragColor = baseColour * (vec4(diff) + vec4(0.1) + (vec4(specular, 1.0) * texture2D(specularTexture, vec2(1.0 - fragUV.x, fragUV.y))));',
  '}'
].join('\n');

var initPlanet = function()
{
  var canvas = document.getElementById("planetCanvas");
  var gl = canvas.getContext('webgl');

	if (!gl) {
		console.log('WebGL not supported, falling back on experimental-webgl');
		gl = canvas.getContext('experimental-webgl');
	}

	if (!gl) {
		alert('Your browser does not support WebGL');
	}

  gl.clearColor(0.0, 0.0, 0.0, 0.0);

	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
  gl.depthFunc(gl.LESS);

	gl.frontFace(gl.CW);
	gl.cullFace(gl.BACK);

  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

  gl.shaderSource(vertexShader, vertexShaderText);
  gl.shaderSource(fragmentShader, fragmentShaderText);

	gl.compileShader(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
		return;
	}

	gl.compileShader(fragmentShader);
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
		return;
	}

  var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error('ERROR linking program!', gl.getProgramInfoLog(program));
		return;
	}
	gl.validateProgram(program);
	if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
		console.error('ERROR validating program!', gl.getProgramInfoLog(program));
		return;
	}

	//
	// Create buffer
	//

  var sphere = generateSphere(1.0, 24, 24);

  var positionAttribLocation = gl.getAttribLocation(program, 'pos');
  var normalAttribLocation = gl.getAttribLocation(program, 'norms');
  var uvAttribLocation = gl.getAttribLocation(program, 'uvs');

  //alert([positionAttribLocation, normalAttribLocation, uvAttribLocation]);

	var vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.vertices), gl.STATIC_DRAW);

  gl.vertexAttribPointer(
    positionAttribLocation, // Attribute location
    3, // Number of elements per attribute
    gl.FLOAT, // Type of elements
    gl.FALSE,
    3 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
    0 // Offset from the beginning of a single vertex to this attribute
  );

  gl.enableVertexAttribArray(positionAttribLocation);

  var normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.normals), gl.STATIC_DRAW);

	gl.vertexAttribPointer(
		normalAttribLocation, // Attribute location
		3, // Number of elements per attribute
		gl.FLOAT, // Type of elements
		gl.FALSE,
		3 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
		0 // Offset from the beginning of a single vertex to this attribute
	);

	gl.enableVertexAttribArray(normalAttribLocation);

  var uvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.uvs), gl.STATIC_DRAW);

	gl.vertexAttribPointer(
		uvAttribLocation, // Attribute location
		2, // Number of elements per attribute
		gl.FLOAT, // Type of elements
		gl.FALSE,
		2 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
		0 // Offset from the beginning of a single vertex to this attribute
	);

	gl.enableVertexAttribArray(uvAttribLocation);

  var indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphere.indices), gl.STATIC_DRAW);

  var albedoTex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, albedoTex);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.texImage2D(
  		gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
  		gl.UNSIGNED_BYTE,
  		document.getElementById('albedo-texture')
  );

  var nightTex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, nightTex);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.texImage2D(
  		gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
  		gl.UNSIGNED_BYTE,
  		document.getElementById('night-texture')
  );

  var specTex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, specTex);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.texImage2D(
  		gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
  		gl.UNSIGNED_BYTE,
  		document.getElementById('specular-texture')
  );

  gl.useProgram(program);

  var worldLoc = gl.getUniformLocation(program, "World");
  var viewLoc = gl.getUniformLocation(program, "View");
  var projLoc = gl.getUniformLocation(program, "Proj");

  var worldMatrix = new Float32Array(16);
  var projMatrix = new Float32Array(16);
  var viewMatrix = new Float32Array(16);

  mat4.identity(worldMatrix);
  mat4.lookAt(viewMatrix, [0, 1.2, -4], [0, 0, 0], [0, 1, 0]);
  mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.clientWidth / canvas.clientHeight, 0.1, 1000.0);

  gl.uniformMatrix4fv(worldLoc, gl.FALSE, worldMatrix);
  gl.uniformMatrix4fv(viewLoc, gl.FALSE, viewMatrix);
  gl.uniformMatrix4fv(projLoc, gl.FALSE, projMatrix);

  var albedoLoc = gl.getUniformLocation(program, "albedoTexture");
  gl.uniform1i(albedoLoc, 0);

  var nightLoc = gl.getUniformLocation(program, "nightTexture");
  gl.uniform1i(nightLoc, 1);

  var specLoc = gl.getUniformLocation(program, "specularTexture");
  gl.uniform1i(specLoc, 2);

  var planetSpin = 0.0;

  var then = Date.now();

	//
	// Main render loop
	//
  var loop = function (now) {
    var dT = (now - then) / 1000;

    planetSpin += 2.0 * dT;

    mat4.fromRotation(worldMatrix, planetSpin, [0, 1, 0]);
    gl.uniformMatrix4fv(worldLoc, gl.FALSE, worldMatrix);

    //console.log(now);
		gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    gl.bindTexture(gl.TEXTURE_2D, albedoTex);
		gl.activeTexture(gl.TEXTURE0);

		gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0);

    then = now;

		requestAnimationFrame(loop);
	};

  requestAnimationFrame(loop);
};
