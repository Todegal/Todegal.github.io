var generateSphere = function(radius, rings, sectors)
{
  const R = 1 / (rings - 1);
  const S = 1 / (sectors - 1);
  var r; var s;

  var vertices = [];
  var normals = [];
  var uvs = [];
  var indices = [];

  for (r = 0; r < rings; r++) for (s = 0; s < sectors; s++)
  {
    const y = Math.sin((Math.PI/2) + Math.PI * r * R);
    const x = Math.cos(2 * Math.PI * s * S) * Math.sin(Math.PI * r * R);
    const z = Math.sin(2 * Math.PI * s * S) * Math.sin(Math.PI * r * R);

    uvs.push(s * S);
    uvs.push(r * R);

    vertices.push(x * radius);
    vertices.push(y * radius);
    vertices.push(z * radius);

    normals.push(x);
    normals.push(y);
    normals.push(z);
  }

  for (r = 0; r < rings - 1; r++) for (s = 0; s < sectors - 1; s++)
  {
      indices.push(r * sectors + (s + 1));
      indices.push(r * sectors + s);
      indices.push((r + 1) * sectors + s);

      indices.push(r * sectors + (s + 1));
		  indices.push((r + 1) * sectors + s);
		  indices.push((r + 1) * sectors + (s + 1));
  }

  return {
    vertices: vertices,
    normals: normals,
    uvs: uvs,
    indices: indices
  };
}
