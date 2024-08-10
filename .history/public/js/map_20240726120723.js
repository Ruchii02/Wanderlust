
mapboxgl.accessToken = mapToken;

  const map = new mapboxgl.Map({
      container: "map", // container ID
      style: "mapbox://styles/mapbox/streets-v12",
      center: { lng: coordinates.lng, lat: coordinates.lat }, // starting position [lng, lat]. Note that lat must be set between -90 and 90
      zoom: 9 // starting zoom
  });
  //console.log(coordinates);

  const marker = new mapboxgl.Marker()
       .setLngLat(coordinates)
       .addTo(map);