
mapboxgl.accessToken = mapToken;
  
  const map = new mapboxgl.Map({
    container: "map", // container ID
    style: "mapbox://styles/mapbox/streets-v12",
    center: coordinates, // starting position [lng, lat]
    zoom: 9 // starting zoom
});

  const marker = new mapboxgl.Marker({color: "red"})
       .setLngLat(coordinates)
       .setPopup(new mapboxgl.Popup({ offset: 25}).setHTML("<h4>Exact location after booking!</h4>"))
       .addTo(map);